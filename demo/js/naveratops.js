;(function ($, window, document, undefined) {
    var pluginName = 'naveratops',
        defaults = {
            scrollOffset: null,
            currentSection: null,
            linkSelector: 'a',
            evtNamespace: '',
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
        this.navTopLimit = this.$el.offset().top;
        this.navHeight = this.$el.outerHeight();
        this.sections = {};

        this.init();
    }

    Plugin.prototype.init = function () {
        this.$el.on('click', 'a', {self: this}, this.handleClick);
        $(window).on('scroll', {self: this}, this.handleScroll);
        $(window).on('resize', {self: this}, this.smartResize);

        this.getSectionData();

        this.options.onCreate(this.$el);
    };

    Plugin.prototype.smartResize = function (e) {
        var self = e.data.self;

        if (self.timeout && e) {
            clearTimeout(self.timeout);
        }

        self.timeout = setTimeout(function () {
                self.getSectionData();
                self.setNav(self.findSection($(window).scrollTop()));
            }, 100);
    };

    Plugin.prototype.getSectionData = function () {
        var $links = this.$el.find('a'),
            numLinks = $links.length;

        while (numLinks--) {
            var section = $links.eq(numLinks).attr('href'),
                topDistance = Math.floor($(section).offset().top - this.navHeight);

            this.sections[section] = topDistance;
        }
    };

    Plugin.prototype.findSection = function (scrollPos) {
        for (key in this.sections) {
            if (this.sections[key] <= scrollPos) {
                return key;
            }
        }
    };

    Plugin.prototype.setNav = function (section) {
        var scrollPos = $(window).scrollTop();

        if (scrollPos >= this.navTopLimit) {
            this.$el.addClass('fixed');
        } else {
            this.$el.removeClass('fixed');
        }

        this.options.onNewSection(this.$el);
        this.currentSection = section;

        this.$el.find('a').removeClass('current');
        $('[href="' + section + '"]').addClass('current');
    };

    Plugin.prototype.scrollTo = function (section) {
        /**
            If section is passed without the pound sign add it.
            This is because we are looking for how far down the page
            that container with that ID is.
        **/
        section = section.indexOf('#') < 0 ? '#' + section : section;

        var self = this,
            scrollAmt = $(section).offset().top - self.navHeight - self.options.scrollOffset;

        $('html, body').animate({scrollTop: scrollAmt}, 600, function () {
            self.options.afterScroll(self.$el);
        });
    };

    Plugin.prototype.handleClick = function (e) {
        e.preventDefault();

        var self = e.data.self,
            section = $(e.currentTarget).attr('href');

        self.options.onNavClick(self.$el);
        self.scrollTo(section);
    };

    Plugin.prototype.handleScroll = function (e) {
        var self = e.data.self,
            scrollPos = $(window).scrollTop(),
            section = self.findSection(scrollPos);

        self.setNav(section);
    };

    Plugin.prototype.destroy = function () {
        this.$el.off('click', 'a', this.handleClick);
        $(window).off('scroll', this.handleScroll);
    };

    Plugin.prototype.create = function () {
        this.init();
    };

    $.fn[pluginName] = function (options, arg) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin(this, options));
            } else if ($.isFunction(Plugin.prototype[options]) && options.indexOf('_') < 0) {
                $.data(this, 'plugin_' + pluginName)[options](arg);
            }
        });
    };

})(jQuery, window, document);