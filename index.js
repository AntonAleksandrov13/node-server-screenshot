var Nightmare = require("nightmare");
require('nightmare-window-manager')(Nightmare);


/**
 * Callback for taking a screenshot of a web page.
 *
 * @callback screenshotCallback
 * @param {Object} [error] - The error object if an error occurred, otherwise undefined.
 */

Nightmare.action('injectHTML', function (selector, html, done) {
    this.evaluate_now(function (selector, html) {

        function applyHTML() {
            "use strict";
            for (var i = 0; i < this.length; i++)
                this[i].innerHTML = html;
        }

        try {
            if (typeof selector == "string")
                return applyHTML.call(document.getElementsByTagName(selector));

            if (selector.tag)
                return applyHTML.call(document.getElementsByTagName(selector.tag));

            if (selector.id)
                return document.getElementById(selector.id).innerHTML = html;

            if (selector.className)
                return applyHTML.call(document.getElementsByClassName(selector.className));

            if (selector.jQuery)
                return applyHTML.call(($ || jQuery || window.jQuery)(selector.jQuery));

        } catch (ex) {
            document.getElementsByTagName("html")[0].innerHTML = ex.stack;
        }
    }, done, selector, html)
});

/**
 * Navigates to a url and takes a screenshot
 * @param {String} url
 * @param {String|null} path - screenshot path
 * @param {Object} options
 * @param {Number=} options.scale
 * @param {Number=} options.width
 * @param {Number=} options.height
 * @param {String=} options.waitAfterSelector
 * @param {Number=} options.waitMilliseconds
 * @param {Object=} options.clip
 * @param {Number} options.clip.x
 * @param {Number} options.clip.y
 * @param {Number} options.clip.width
 * @param {Number} options.clip.height
 *
 * @param {screenshotCallback} callback
 * @param patternForDetectingCookieConsent A regular expression that should match a text inside <a> tag.
 *                                          This way you can find a cookie consent button and click it later on
 * @param patternFlags
 */
module.exports.fromURL = function (url, path, options, callback, patternForDetectingCookieConsent, patternFlags) {
    "use strict";

    if (typeof options == "function") {
        callback = options;
        options = null;
    }
    patternForDetectingCookieConsent = patternForDetectingCookieConsent || /(ok)|(agree)|(accept)|(cookies)/;
    patternFlags = patternFlags || ["i"];
    options = options || {};
    callback = callback || function () {
    };
    if (options.clip) {
        if (typeof options.clip.x !== 'number') {
            options.clip.x = 0;
        }
        if (typeof options.clip.y !== 'number') {
            options.clip.y = 0;
        }
    }

    var n = Nightmare({
        switches: {'force-device-scale-factor': options.scale ? options.scale.toString() : '1'},
        show: typeof options.show === 'boolean' ? options.show : false,
        width: options.width || 1366,
        height: options.height || 768,
        executionTimeout: 5000
    });

    n
        .goto(url)
        .wait(options.waitAfterSelector || "html")
        //let it show a cookie consent pop up
        .wait(2000)
        .evaluate((pattern, flags)  => {
            //filters elements
            const elements = Array.from(document.querySelectorAll('a')).filter(a => new RegExp(pattern, flags.toString()).test(a.innerText));
            //checks if anything has been found
            if (elements.length > 0)
                elements[0].className += " click-class";
        }, patternForDetectingCookieConsent, patternFlags)
        .click('.click-class')  //click em, yee haaw
        .wait(2000)
        .screenshot(
            path || undefined,
            options.clip || undefined
        )
        .then(function (buff) {
            callback(null, buff);
        })
        .catch(function (err) {
            callback(err);
        });

    n.end();
};

/**
 * Navigates to a url and takes a screenshot
 * @param {String} html
 * @param {String|null} path - screenshot path
 * @param {Object} options
 * @param {Number=} options.scale
 * @param {Number=} options.width
 * @param {Number=} options.height
 * @param {String=} options.waitAfterSelector
 * @param {Number=} options.waitMilliseconds
 * @param {Object=} options.clip
 * @param {Number} options.clip.x
 * @param {Number} options.clip.y
 * @param {Number} options.clip.width
 * @param {Number} options.clip.height
 * @param {Object=} options.inject
 * @param {Number} options.inject.url
 * @param {String|{tag: String}|{id: String}|{className: String}|{jQuery: String}} options.inject.selector
 *
 * @param {screenshotCallback} callback
 */
module.exports.fromHTML = function (html, path, options, callback) {
    "use strict";
    if (typeof options == "function") {
        callback = options;
        options = null;
    }

    options = options || {};
    callback = callback || function () {
    };
    options.inject = options.inject || {};
    if (options.clip) {
        if (typeof options.clip.x !== 'number') {
            options.clip.x = 0;
        }
        if (typeof options.clip.y !== 'number') {
            options.clip.y = 0;
        }
    }

    var n = Nightmare({
        switches: {'force-device-scale-factor': options.scale ? options.scale.toString() : '1'},
        show: typeof options.show === 'boolean' ? options.show : false,
        width: options.width || 1366,
        height: options.height || 768
    });

    n
        .goto(options.inject.url || "about:blank")
        .wait(options.waitAfterSelector || "html")
        .wait(options.waitMilliseconds || 1000)
        .injectHTML(options.inject.selector || "html", html)
        .wait(options.waitAfterSelector || "html")
        .wait(options.waitMilliseconds || 1000)
        .screenshot(
            path || undefined,
            options.clip || undefined
        )
        .then(function (buff) {
            callback(null, buff);
        })
        .catch(function (err) {
            callback(err);
        });
    n.end();
};
