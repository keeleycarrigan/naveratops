;(function ($, window, document, undefined) {
    var pluginName = 'naveratops',
        $window = $(window),
        defaults = {
            scrollOffset: 0,
            currentSection: null,
            navPosition: 'top',
            stickyClass: 'fixed',
            linkActiveClass: 'active',
            linkSelector: 'a',
            linkAttr: 'href',
            sectionAttr: 'id',
            evtNamespace: '',
            navOffset: 0,
            offsetAttr: null,
            onInit: $.noop,
            onCreate: $.noop,
            onNewSection: $.noop,
            onNavClick: $.noop,
            afterScroll: $.noop
        };

    $.extend($.expr[':'], {
        data: function (el) {
            return typeof($(el).data('plugin_' + pluginName)) === 'object';
        }
    });

    function Plugin(element, options) {
        this.el = element;
        this.$el = $(this.el);

        var dataOptions = this.$el.data('nt-options');

        if (dataOptions) {
            options = $.extend({}, options, dataOptions);
        }

        this.options = $.extend({}, defaults, options);
        this._name = pluginName;
        this.navTopLimit = this.options.navOffset || this.$el.offset().top;
        this.navHeight = this.$el.outerHeight();
        this.scrollPos = $window.scrollTop();
        this.notAnimated = true;
        this.sections = [];
        
        this.getSectionData();

        this.init();
    }

    Plugin.prototype.init = function () {
        this.options.onCreate(this);

        this.$el.on('click', this.options.linkSelector, {self: this}, this.handleClick);
        $window.on('scroll resize', {self: this}, this.handleWindow);
        
        this.setNav(true);
    };

    Plugin.prototype.handleWindow = function(e) {
        var self = e.data.self;

        if (e.type === 'scroll') {
            self.setNav(self.notAnimated);
        } else {
            self.smartResize(e);
        }
    };

    Plugin.prototype.smartResize = function (e) {
        var self = this;

        if (self.resizeTimeout && e) {
            clearTimeout(self.resizeTimeout);
        }

        self.resizeTimeout = setTimeout(function () {
                self.getSectionData();
                self.setNav(true);
            }, 100);
    };

    Plugin.prototype.getSectionData = function () {
        var $links = this.$el.find(this.options.linkSelector),
            numLinks = $links.length,
            topOffset = this.options.navPosition === 'top' ? this.navHeight * 2: 0;

            topOffset = topOffset + this.options.scrollOffset;

        for (var i = 0; i < numLinks; i += 1) {

            var $link = $links.eq(i),
                sectionName = $link.attr(this.options.linkAttr),
                $section = $('[' + this.options.sectionAttr +'="' + sectionName.replace('#', '') + '"]'),
                topDist = i === 0 ? 0 : Math.floor($section.offset().top - topOffset),
                sectionData = {
                    top: topDist,
                    name: sectionName,
                    sectionSelector: $section,
                    linkSelector:  $link
                };

            this.sections.push(sectionData);
        }

        /**
            Second loop to determine the bottom of each section by assuming
            it's bottom is right above the top of the next section.
        **/
        for (var j = 0; j < numLinks; j += 1) {
            var bottomDist = j === numLinks - 1 ? Number.POSITIVE_INFINITY : this.sections[j + 1].top - 1;

            this.sections[j]['bottom'] = bottomDist;
        }

        this.currentSection = this.sections[0];
    };

    Plugin.prototype.findSection = function (key, val) {
        var self = this;

        return {
            then: function (callback) {
                var scrollPos = $window.scrollTop(),
                    sectionIndex = self.sections.length;

                while (sectionIndex--) {
                    var section = self.sections[sectionIndex];

                    if (key && val) {
                        if (section[key] === val) {
                            break;
                        }
                    } else {
                        if (section.top <= scrollPos && section.bottom >= scrollPos) {
                            break;
                        }
                    }
                }

                callback(section);
            }
        }
    };

    Plugin.prototype.adjustOffset = function () {
        if (this.navTopLimit - this.scrollPos <= 0 || this.scrollPos > this.navTopLimit) {
            return 0;
        } else {
            return this.navTopLimit - this.scrollPos;
        }
    };

    Plugin.prototype.setNav = function(setLink) {
        var self = this;

        this.scrollPos = $window.scrollTop();

        if (this.scrollPos >= this.navTopLimit) {
            this.$el.addClass(this.options.stickyClass);
        } else {
            this.$el.removeClass(this.options.stickyClass);
        }

        if (this.options.navOffset) {
            var offsetStyle = {};

            offsetStyle[this.options.offsetAttr] = this.adjustOffset();

            this.$el.css(offsetStyle);
        }

        /**
            Separating the nav set and active link so the active link
            doesn't visually change while scrolling through every section
            after clicking another nav item and the 'onNewSection' function
            doesn't fire through every section change when using the nav bar
            to navigate sections instead of scrolling.
        **/
        if (setLink) {
            self.findSection().then(function (section) {
                if (self.currentSection.name !== section.name) {
                    self.options.onNewSection(self);
                }

                self.setActiveLink(section)
            });
        }
    };

    Plugin.prototype.setActiveLink = function (section) {
        this.currentSection = section;

        this.$el.find(this.options.linkSelector).removeClass(this.options.linkActiveClass);
        section.linkSelector.addClass(this.options.linkActiveClass);
        
    };

    Plugin.prototype.scrollTo = function (section) {
        var self = this,
            scrollAmt = section.top === 0 ? self.navTopLimit : section.top;

        self.notAnimated = false;

        $('html, body').animate({scrollTop: scrollAmt}, 600, function () {
            /**
                Need to have 'html, body' for this to work in older IE but to keep
                this code from firing twice because the animate is on two elements
                we check to see if it's notAnimated and only execute this that variable
                is still set to false.
            **/
            if (!self.notAnimated) {
                self.setNav(true);
                self.options.afterScroll(self);
                self.notAnimated = true;
            }
        });
    };

    Plugin.prototype.handleClick = function (e) {
        e.preventDefault();

        var self = e.data.self,
            sectionName = $(e.currentTarget).attr(self.options.linkAttr);

        self.options.onNavClick(self);
        
        self.findSection('name', sectionName).then(function (section) {
            self.scrollTo(section);
        })
    };

    Plugin.prototype.destroy = function () {
        this.$el.off('click', this, this.handleClick);
        $window.off('scroll resize', this.handleWindow);
    };

    Plugin.prototype.create = function () {
        this.init();
    };

    $.fn[pluginName] = function (options, args) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
            } else if ($.isFunction(Plugin.prototype[options]) && options.indexOf('_') < 0) {
                // Possibly be refactored, but allows passing multiple arguments to methods
                var thePlugin = $.data(this, 'plugin_' + pluginName);
                // So IE8 doesn't freak out if you don't pass anything to apply as an argument.
                args = args || [];

                thePlugin[options].apply(thePlugin, args);
            }
        });
    };

})(jQuery, window, document);
