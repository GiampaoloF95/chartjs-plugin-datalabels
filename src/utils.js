import {isNullOrUndef} from 'chart.js/helpers';

var devicePixelRatio = (function() {
  if (typeof window !== 'undefined') {
    if (window.devicePixelRatio) {
      return window.devicePixelRatio;
    }

    // devicePixelRatio is undefined on IE10
    // https://stackoverflow.com/a/20204180/8837887
    // https://github.com/chartjs/chartjs-plugin-datalabels/issues/85
    var screen = window.screen;
    if (screen) {
      return (screen.deviceXDPI || 1) / (screen.logicalXDPI || 1);
    }
  }

  return 1;
}());

var utils = {
  // @todo move this in Chart.helpers.toTextLines
  toTextLines: function(inputs) {
    var lines = [];
    var input;

    inputs = [].concat(inputs);
    while (inputs.length) {
      input = inputs.pop();
      if (typeof input === 'string') {
        lines.unshift.apply(lines, input.split('\n'));
      } else if (Array.isArray(input)) {
        inputs.push.apply(inputs, input);
      } else if (!isNullOrUndef(inputs)) {
        lines.unshift('' + input);
      }
    }

    return lines;
  },

  toTextChunks(text) {
    if (typeof text !== 'string') {
      throw new TypeError('Text must be a string');
    }
  
    var chunks = [];
    var preIndex = 0;

    // Looks for **bold text** or *italic text*
    var regex = /\*{2}(?<bold>.+?)\*{2}|\*(?<italic>.+?)\*/gm;
  
    // Text is split into chunks, for every match found
    text.matchAll(regex).forEach(elem => {
      var styledText = elem.groups['bold'] ?? elem.groups['italic'] ?? "";
      // Every match two chunks are created.
      // The first chuck contains the unstyled text preceding the styled text.
      // If the text starts styled the first chunk is empty.
      chunks.push(
        {
          text: text.substring(preIndex, elem.index),
          start: preIndex,
          end: elem.index,
          style: 'normal',
        },
        {
          text: styledText,
          start: elem.index,
          end: elem.index + elem[0].length,
          style: elem.groups['bold'] ? 'bold' : 'italic',
        }
      );
      // Move index to end of the styled word to start with the next chunk.
      preIndex = elem.index + elem[0].length;
    });
  
    // Add a chuck for any non styled text remaing after last chuck is added.
    if(chunks.length && chunks.at(-1).end !== text.length) {
      chunks.push({
          text: text.substring(chunks.at(-1).end,),
          start: chunks.at(-1).end,
          end: text.length,
          style: 'normal',
        });
    }

    // If no style is detected just created a chuck containing the whole text
    if(!chunks.length && text) {
      chunks.push({
        text: text,
        start: 0,
        end: text.length,
        style: 'normal',
      });
    }

    return chunks;
  },

  // @todo move this in Chart.helpers.canvas.textSize
  // @todo cache calls of measureText if font doesn't change?!
  textSize: function(ctx, lines, font) {
    var items = [].concat(lines);
    var ilen = items.length;
    var prev = ctx.font;
    var width = 0;
    var i;

    ctx.font = font.string;

    for (i = 0; i < ilen; ++i) {
      width = Math.max(ctx.measureText(items[i]).width, width);
    }

    ctx.font = prev;

    return {
      height: ilen * font.lineHeight,
      width: width
    };
  },

  /**
   * Returns value bounded by min and max. This is equivalent to max(min, min(value, max)).
   * @todo move this method in Chart.helpers.bound
   * https://doc.qt.io/qt-5/qtglobal.html#qBound
   */
  bound: function(min, value, max) {
    return Math.max(min, Math.min(value, max));
  },

  /**
   * Returns an array of pair [value, state] where state is:
   * * -1: value is only in a0 (removed)
   * *  1: value is only in a1 (added)
   */
  arrayDiff: function(a0, a1) {
    var prev = a0.slice();
    var updates = [];
    var i, j, ilen, v;

    for (i = 0, ilen = a1.length; i < ilen; ++i) {
      v = a1[i];
      j = prev.indexOf(v);

      if (j === -1) {
        updates.push([v, 1]);
      } else {
        prev.splice(j, 1);
      }
    }

    for (i = 0, ilen = prev.length; i < ilen; ++i) {
      updates.push([prev[i], -1]);
    }

    return updates;
  },

  /**
   * https://github.com/chartjs/chartjs-plugin-datalabels/issues/70
   */
  rasterize: function(v) {
    return Math.round(v * devicePixelRatio) / devicePixelRatio;
  }
};

export default utils;
