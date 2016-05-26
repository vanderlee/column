/*jslint devel: true, bitwise: true, regexp: true, browser: true, confusion: true, unparam: true, eqeq: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
/*globals jQuery */

/*!
 * Column
 *
 * Copyright (c) 2011-2015 Martijn W. van der Lee
 * Licensed under the MIT.
 */
/* Emulate CSS3 style column on browsers that don't support it.
 */

;(function ($) {
	"use strict";

	$.fn.column = function(options) {
		var settings = {
				'count':		'auto',
				'gap':			'normal',
				'rule_color':	'',
				'rule_style':	'none',
				'rule_width':	'medium',
				'split':		'word',
				'width':		'auto',
				'after':		null,
				'before':		null
			},
			measureEm = function(scope) {
				var element = $('<div style="display:none;height:100em;margin:0;padding:0;border:0"/>').appendTo(scope),
					px = element.height() / 100;
				element.remove();
				return px;
			},
			measureBorderWidth = function(type) {
				var element = $('<div style="border:'+type+' solid transparent;height:0px"/>').appendTo('body'),
					width = element.outerHeight() / 2;
				element.remove();
				return width;
			},
			borderWidths = {
				thin:	measureBorderWidth('thin'),
				medium: measureBorderWidth('medium'),
				thick:	measureBorderWidth('thick')
			},
			indexOfRegExp = function(string, pattern, modifiers) {
				var re = new RegExp(pattern, modifiers),
					m = re.exec(string.valueOf());
				return (m == null? -1 : m.index);
			},
			splitStrategies = {
				word: function(node) {
					var contents = [],
						split;
					do {
						contents.push(node);
						if (split = indexOfRegExp(node.nodeValue, '\\s+') + 1) {
							if (split < node.length) {
								node = node.splitText(split);
							} else {
								split = 0;
							}
						}
					} while (split);
					return contents;
				},
				sentence: function(node) {
					var contents = [],
						split;
					do {
						contents.push(node);
						if (split = indexOfRegExp(node.nodeValue, '[.:!?]+') + 1) {
							if (split < node.length) {
								node = node.splitText(split);
							} else {
								split = 0;
							}
						}
					} while (split);
					return contents;
				}
			},
			split = function(parent) {
				var contents = [];
				$(parent).contents().each( function(index, value) {
					if (value.nodeType === 3) {
						contents = contents.concat(splitStrategies[settings.split](value));
					} else {
						contents.push(value);
					}
				});
				return contents;
			};

		if (typeof settings.before === 'function') {
			settings.before.call();
		}

		var result = this.each(function() {
			// Merge options
			if (options) {
				$.extend(settings, options);
			}

			// per-instance settings
			var element			= this,
				content			= $(this).html(),	// entire bulk
				contents		= split(this),
				gap_normal		= measureEm(this);

			// the active part
			_resize();	// do once pre-load so we atleast have columns
			$(window).resize(_resize).load(_resize);

			// worker
			function _resize() {
				// Clear columns
				$(element).find(">*").detach();

				var column_gap		= (settings.gap === parseFloat(settings.gap))? settings.gap : gap_normal,
					rule_width		= 0,
					column_count,
					column_width,
					width;

				if (settings.rule_style !== 'none') {
					var rule_color = (settings.rule_color? settings.rule_color : $(element).css('color'));
					rule_width = (settings.rule_width === parseFloat(settings.rule_width)? settings.rule_width : borderWidths[settings.rule_width]);
					column_gap		-= rule_width;
				}

				if (settings.width !== 'auto') {
					column_count = Math.max(1, Math.floor(($(element).width() + rule_width) / (settings.width + column_gap)));
				} else if (settings.count !== 'auto') {
					column_count = Math.max(1, settings.count);
				} else {
					return;
				}

				width			= $(element).width() - ((column_count - 1) * column_gap);
				column_width	= Math.floor(width / column_count);

				// Setup columns
				var left = 0;
				for (var c = 0; c < column_count; ++c) {
					var style	= 'position:absolute;'
								+ (c > 0?                'left:'+(left - Math.floor(column_gap / 2))+'px;' : '')
								+ 'width:'+column_width+'px;'
								+ (c > 0?				 'padding-left:'+Math.ceil(column_gap / 2)+'px;' : '')
								+ (c < column_count - 1? 'padding-right:'+Math.floor(column_gap / 2)+'px;' : '')
								+ 'overflow:hidden;'
								;
					left += column_width;
					left += column_gap;
					if (c > 0 && settings.rule_style != 'none') {
						style	+= 'border-left:'+rule_width+'px '+settings.rule_style+' '+rule_color+';';
						left	+= rule_width;
					}
					$(element).append('<div style="'+style+'"/>');
				}

				// Determine height of total content in a single column
				var first = $('div', element).first();
				var height = first.html(content).height();
				first.find(">*").detach();
				var height_step = Math.ceil(height / column_count);

				// Fill columns
				var contents_length = contents.length;
				var max_height = 0;
				var i = 0;
				for (var c = 0; c < column_count; ++c) {
					var div = $('div', element).eq(c);

					if (c < column_count - 1) {
						// detect overflow
						while (i < contents_length && div.height() <= height_step) {
							div.append(contents[i++]);
						}

						// fill up rest of div
						var div_height = div.height();
						while (i < contents_length && div.height() == div_height) {
							div.append(contents[i++]);
						}

						// retract last part of content
						div.contents().last().detach();
						--i;
					} else {
						// dump remaining content in the last column
						while (i < contents_length) {
							div.append(contents[i++]);
						}
					}

					max_height = Math.max(max_height, div.height());
				}

				// Set all to the same height
				$('div', element).add(element).css('height', max_height);
			}

		});

		if (typeof settings.after === 'function') {
			settings.after.call();
		}

		return result;
	};
})(jQuery);
