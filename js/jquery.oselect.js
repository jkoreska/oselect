/*!
 * © 2013 Luktek
 * oSelect v0.1.0
 * A more useful kind of <select/>
 */

!(function ($) {

    'use strict';

    var OSelect = function(element, options) {
        this.options = options;
        this.$element = $(element);
        this._init();
    };

    OSelect.prototype = {
        _init: function () {
            this._injectElements();
            this._bindEvents();
            this._buildDropdown();
        },
        _injectElements: function () {
            this.$dropdown =
                $('<div/>')
                    .addClass('oselect-dropdown')
                    .css({
                        position: 'absolute',
                        display: 'none',
                        'z-index': 1000,
                        'max-height': '200px',
                        'overflow': 'hidden',
                        'overflow-y': 'auto'
                    });
            this.$input =
                $('<input/>')
                    .attr('type', 'text')
                    .attr('autocomplete', 'off')
                    .attr('style', this.$element.attr('style'))
                    .attr('class', this.$element.data('class'))
                    .addClass('oselect-input');
            this.$button =
                $('<a/>')
                    .addClass('oselect-button')
                    .attr('href', '#')
                    .attr('tabindex', -1)
                    .css({ display: 'inline-block' })
                    .html(
                        $('<span/>')
                            .css({
                                width: 0, height: 0,
                                display: 'inline-block',
                                'border-top': '4px solid #000000',
                                'border-left': '4px solid transparent',
                                'border-right': '4px solid transparent',
                            })
                    );
            var wrapper =
                $('<span/>')
                    .addClass('oselect')
                    .css({
                        position: 'relative',
                        display: 'inline-block',
                    })
                    .append(this.$dropdown, this.$input, this.$button);
            
            this.$element
                .after(wrapper)
                .detach()
                .attr('type', 'hidden')
                .prependTo(wrapper);
        },
        _bindEvents: function () {
            this.$input
                .on('focus.oselect', $.proxy(this._inputFocus, this))
                .on('keyup.oselect', $.proxy(this._inputKeyup, this))
                .on('keydown.oselect', $.proxy(this._inputKeydown, this));
            this.$button
                .on('click.oselect', $.proxy(this._buttonClick, this));
            $(document)
                .on('mousedown.oselect', $.proxy(this._documentMousedown, this));
        },
        _inputFocus: function (e) {
            this.focus();
            this.activate(this._selected);
        },
        _inputKeyup: function (e) {
            if (38 == e.keyCode)
                this.activatePrevious();
            else if (40 == e.keyCode)
                this.activateNext();
            else if (8 == e.keyCode || 32 == e.keyCode || e.keyCode >= 48)
                this.focus();
        },
        _inputKeydown: function (e) {
            if (27 == e.keyCode) {
                if (this.$dropdown.is(':visible'))
                    this.unfocus();
                else
                    this.select(null);
            } else if (13 == e.keyCode) {
                e.preventDefault();
                this.selectActive();
                this.unfocus();
            } else if (9 == e.keyCode) {
                this.selectActive();
                this.unfocus();
            } else if (8 == e.keyCode || 32 == e.keyCode || e.keyCode >= 48) {
                if (!this._typing) {
                    this.$input.val('');
                    this._typing = true;
                }
            }
        },
        _buttonClick: function (e) {
            e.preventDefault();
            this.$input.focus();
        },
        _documentMousedown: function (e) {
            if (e.target == this.$input[0] || e.target == this.$dropdown[0]) {
                this.focus();
            } else {
                this.unfocus();
            }
        },
        _itemMousedown: function (e) {
            e.preventDefault();
            this.select($(e.target));
            this.unfocus();
        },
        _buildDropdown: function () {
            var source = this.options.source.slice()
              , empty = {};
            
            empty[this.options.labelProperty] = this.options.labelDefault;
            source.splice(0, 0, empty);

            this.$dropdown.html('');

            for (var n = 0; n < source.length; n++) {
                var key =
                    source[n][this.options.valueProperty] || 'unknown';
                var title =
                    source[n][this.options.labelProperty];
                var label =
                    this.options.labelCallback
                        ? this.options.labelCallback(source[n])
                        : title || '&nbsp;';

                this.$dropdown.append(
                    $('<div/>')
                        .on('mousedown.oselect', $.proxy(this._itemMousedown, this))
                        .addClass(this._itemSelector(key))
                        .addClass('oselect-item')
                        .css({ cursor:'pointer' })
                        .data('oselect', source[n])
                        .attr('title', title)
                        .html(label)
                );
            }

            this.selectKey(this.$element.val());
        },
        _refreshDropdown: function () {
            $('.oselect-item', this.$dropdown).show();

            if (this._typing) {
                var input = this.$input.val().toLowerCase();
                var filterProperties = this.options.filterProperties;
                $('.oselect-item', this.$dropdown).each(function (index) {
                    for (var m = filterProperties.length - 1; m >= 0; m--) {
                        var value = $(this).data('oselect')[filterProperties[m]];
                        if (null != value && value.toLowerCase().match(input) == input)
                            return;
                    }
                    $(this).hide();
                });
            }
        },
        _showDropdown: function () {
            this.$dropdown
                .css('top', this.$input.outerHeight())
                .css('width', this.$input.outerWidth())
                .show();
        },
        _hideDropdown: function () {
            this.$dropdown
                .hide();
        },
        _itemSelector: function (key) {
            return 'oselect-item-' + this._escapeKey(key);
        },
        _escapeKey: function (key) {
            return key.toString().replace(/\//g, '_');
        },
        destroy: function () {
            this.$input.remove();
            this.$button.remove();
            this.$dropdown.remove();
            this.$element.removeData('oselect');
            
            $(document).unbind('.oselect');

            var wrapper =
                this.$element.parent();
            this.$element
                .detach()
                .attr('type', 'text');
            wrapper
                .after(this.$element)
                .remove();
        },
        reload: function (data) {
            if (data) this.options.source = data;
            this._buildDropdown();
        },
        select: function ($e) {
            var value = '';
            $('.oselect-item', this.$dropdown).removeClass('selected');

            if ($e && $e.length) {
                this._selected = $e;
                value = $e.data('oselect')[this.options.valueProperty];
            } else {
                this._selected = this.$dropdown.find('.oselect-item').first();
            }

            this._selected.addClass('selected');
            this.activate(this._selected);

            var item = this._selected.data('oselect');
            if (!item[this.options.valueProperty]) item = null;
            
            this.$element
                .val(value)
                .trigger('selected', item);
        },
        selectKey: function (key) {
            this.select($('.' + this._itemSelector(key), this.$dropdown));
        },
        selectActive: function () {
            this.select(this._active);
        },
        selected: function() {
            var item = this._selected.data('oselect');
            if (!item[this.options.valueProperty]) item = null;
            return item;
        },
        activate: function ($e) {
            $('.oselect-item', this.$dropdown).removeClass('active');

            if ($e && $e.length) {
                this._active = $e
                    .addClass('active');
                this.$dropdown.scrollTop(
                    this.$dropdown.scrollTop() + $e.position().top - 48
                );
                if (!this._typing)
                    this.$input.val(
                        $e.data('oselect')[this.options.labelProperty]
                    );
            } else {
                this._active = null;
                this.$input.val('');
            }
        },
        activateNext: function () {
            this._showDropdown();
            if (this._active)
                this._active = this._active.nextAll(':visible:first');
            if (!this._active || !this._active.length)
                this._active = this.$dropdown.children(':visible:first');
            this.activate(this._active);
        },
        activatePrevious: function () {
            this._showDropdown();
            if (this._active)
                this._active = this._active.prevAll(':visible:first');
            if (!this._active || !this._active.length)
                this._active = this.$dropdown.children(':visible:last');
            this.activate(this._active);
        },
        focus: function () {
            this._refreshDropdown();
            this._showDropdown();
        },
        unfocus: function () {
            this._hideDropdown();
            this._typing = null;
            this.$input.val(
                this._selected
                    ? this._selected.data('oselect')[this.options.labelProperty]
                    : this.options.labelDefault
            );
        },
    };
    
    $.fn.oselect = function (option) {
        var retval = []
          , $element = this
          , args = arguments;
        
        $element.each(function () {
            var $this = $(this)
              , oselect = $this.data('oselect');

            if (!oselect) {
                var options = $.extend({}, $.fn.oselect.defaults, typeof option == 'object' && option);
                $this.data('oselect', new OSelect(this, options));
            } else if ('string' == typeof option) {
                if (oselect[option])
                    retval.push(oselect[option].apply(oselect, Array.prototype.slice.call(args, 1)));
                else
                    $.error('Method ' + option + ' does not exist on jQuery.oselect');
            }
        });
        
        if (0 == retval.length) retval = $element;
        else if (1 == retval.length) retval = retval[0];

        return retval;
    };

    $.fn.oselect.defaults = {
        source: [],
        valueProperty: 'Value',
        labelProperty: 'Label',
        labelDefault: '',
        filterProperties: [ 'Title', 'Description' ],
    };

})(window.jQuery);
