/*!
 * DropdownPicker v@VERSION
 * https://github.com/ShuraChow/dropdown-picker
 *
 * Copyright (c) 2018-@YEAR ShuraChow
 * Released under the MIT license
 *
 * Date: @DATE
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node / CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals.
        factory(jQuery);
    }
})(function ($) {

    'use strict';

    var NAMESPACE = 'dropdownpicker';
    var EVENT_CHANGE = 'change.' + NAMESPACE;
    var EVENT_CLICK = 'click.' + NAMESPACE;
    var OPTIONS = {
        placeholder:'请选择',
        // path: level_1.id,.....,level_x.id
        // single: level_x.id
        type:'single',
        need_choice_minimal_level: true,
        data:[]
    };

    function DropdownPicker(element,options) {
        this.el = element;
        this.$element = $(element);
        this.options = $.extend({}, OPTIONS, $.isPlainObject(options) && options);
        this.data = {};
        this.datalist = {};
        this.needBlur = false;
        this.choiced_minimal_level = false;
        this.choicepath = {};
        this.init();
    }

    DropdownPicker.prototype = {
        'maxlevel':1,
        init: function () {
            this.makeData();
            this.render();
            this.bind();
        },

        render: function() {
            var $this = this;
            var p = this.getPosition();
            var placeholder = this.$element.attr('placeholder') || this.options.placeholder;
            var textspan = '<span class="dropdown-picker-span" style="' +
                this.getWidthStyle(p.width) + 'height:' +
                p.height + 'px;line-height:' + (p.height - 1) + 'px;">' +
                (placeholder ? '<span class="placeholder">' + placeholder + '</span>' : '') +
                '<span class="title"></span><div class="arrow"></div>' + '</span>';
            var dropdown = '<div class="dropdown-picker" data-from="'+this.$element.attr('name')+'" style="left:0px;top:100%;' +
                this.getWidthStyle(p.width, true) + '">' +
                '<div class="dropdown-select-wrap">' +
                '<div class="dropdown-select-tab">' +
                '<a class="dropdown-tab active" data-level="1">/</a>' +
                '<div class="dropdown-select-content">' +
                '<div class="dropdown-select level_1" data-level="1" style="display: block;"></div>' +
                '</div></div>';
            this.$element.addClass('dropdown-picker-input');
            this.$textspan = $(textspan).insertAfter(this.$element);
            this.$dropdown = $(dropdown).insertAfter(this.$textspan);

            this.refresh();
        },

        bind:function(){
            var $this = this;

            $(document).on('click', (this._mouteclick = function (e) {
                var $target = $(e.target);
                var $dropdown, $span, $input;
                if ($target.is('.dropdown-picker-span')) {
                    $span = $target;
                } else if ($target.is('.dropdown-picker-span *')) {
                    $span = $target.parents('.dropdown-picker-span');
                }
                if ($target.is('.dropdown-picker-input')) {
                    $input = $target;
                }
                if ($target.is('.dropdown-picker')) {
                    $dropdown = $target;
                } else if ($target.is('.dropdown-picker *')) {
                    $dropdown = $target.parents('.dropdown-picker');
                }
                if ((!$input && !$span && !$dropdown) ||
                    ($span && $span.get(0) !== $this.$textspan.get(0)) ||
                    ($input && $input.get(0) !== $this.$element.get(0)) ||
                    ($dropdown && $dropdown.get(0) !== $this.$dropdown.get(0))) {
                    $this.close(true);
                }

            }));

            this.$element.on('change', (this._changeElement = $.proxy(function () {
                this.close(true);
            }, this))).on('focus', (this._focusElement = $.proxy(function () {
                this.needBlur = true;
                this.open();
            }, this))).on('blur', (this._blurElement = $.proxy(function () {
                if (this.needBlur) {
                    this.needBlur = false;
                    this.close(true);
                }
            }, this)));

            this.$textspan.on('click', function (e) {
                var $target = $(e.target), level,id;
                $this.needBlur = false;
                if ($target.is('.select-item')) {
                    level = $target.data('level');
                    $this.tab(level-1);
                    $this.open();
                } else {
                    if ($this.$dropdown.is(':visible')) {
                        $this.close();
                    } else {
                        $this.open();
                    }
                }
            }).on('mousedown', function () {
                $this.needBlur = false;
            });
            this.$dropdown.on('click', '.dropdown-select a', function () {
                var $select = $(this);
                var $selects = $(this).parents('.dropdown-select');
                var $current_id = $select.data('id');
                var $current_level = $select.data('level');
                var $title = $select.data('title');
                var $next_level = $current_level + 1;

                $this.choicepath[$current_level] = $current_id;
                $selects.data('item', $this.data[$current_level][$select.data('parent_id')][$select.data('id')]);
                var $active = $selects.find('a.active');
                $active.removeClass('active');
                $select.addClass('active');

                if ($active.data('id') !== $(this).data('id')) {
                    $this.choiced_minimal_level = false;
                    $this.removeNextLvel($next_level);
                    $(this).trigger(EVENT_CHANGE);
                    if (!$this.data[$next_level] || !$this.data[$next_level][$current_id]) {
                        $this.choiced_minimal_level = true;
                        $this.close();
                    } else {
                        $this.tab($current_level,$title);
                        $this.output($next_level,$current_id);
                    }
                    if ($next_level>$this.maxlevel) {
                        $this.close();
                    }
                    $this.feedText();
                }
            }).on('click', '.dropdown-select-tab a', function () {
                if (!$(this).hasClass('active')) {
                    var level = $(this).data('level');
                    $this.tab(level-1);
                }
            }).on('mousedown', function () {
                $this.needBlur = false;
            });

        },

        removeNextLvel:function (level) {
            var $this = this;
            var $tab = this.getElement().find('.dropdown-tab');
            var $select = this.getElement().find('.dropdown-select');
            var $item = this.getElement().find('.select-item');
            $.each($tab,function () {
                if ($(this).data('level') >= level){
                    $(this).remove();
                    delete $this['$tab_level_'+$(this).data('level')];
                }
            });
            $.each($select,function () {
                if ($(this).data('level') >= level){
                    $(this).remove();
                    delete $this['$select_level_'+$(this).data('level')];
                }
            });
            $.each($item,function () {
                if ($(this).data('level') >= level){
                    $(this).remove();
                }
            });
        },

        getChoice:function(){
            var $tabs = this.getElement().find('.dropdown-select');
            var $choice = {};
            $.each($tabs, function(){
                var _item = $(this).data('item');
                if (_item) $choice[_item['id']] = _item;
            });
            return $choice
        },

        getText: function () {
            var $choice = this.getChoice();
            var text = [];
            for(var i in $choice){
                if ($choice[i]) {
                    text.push('<span class="select-item"' +
                        'data-id="' + $choice[i].id + '"' +
                        'data-level="' + $choice[i].level + '"' +
                        'data-parent_id="' + $choice[i].parent_id + '"' +
                        '>' + $choice[i].title + '</span>');
                }
            }
            return text.join(' / ');
        },

        getMinimalLevel: function() {
            var $choice = this.getChoice();
            var item = {};
            for(var i in $choice) item = $choice[i];
            return item;
        },

        getLevelPath: function() {
            var $choice = this.getChoice();
            var path = [];
            for(var i in $choice) path.push($choice[i]);
            return path;
        },

        feedText:function() {
            var text = this.getText();
            if (text) {
                this.$textspan.find('>.placeholder').hide();
                this.$textspan.find('>.title').html(this.getText()).show();
            } else {
                this.$textspan.find('>.placeholder').text(this.getPlaceHolder()).show();
                this.$textspan.find('>.title').html('').hide();
            }
            if (!this.options.need_choice_minimal_level || this.choiced_minimal_level) {
                var feedvalue = "";
                switch (this.options.type) {
                    case 'single' : feedvalue = this.getMinimalLevel().id;break;
                    case 'path' :
                        var path = this.getLevelPath();
                        var _feedvalue = [];
                        path.forEach(function (p) {
                            _feedvalue.push(p.id)
                        });
                        feedvalue = _feedvalue.join(',');break;
                }
                console.log(feedvalue);
                $(this.$element).val(feedvalue);
            }
        },

        getPlaceHolder: function () {
            return this.$element.attr('placeholder') || this.options.placeholder;
        },

        unbind: function () {

            $(document).off('click', this._mouteclick);

            this.$element.off('change', this._changeElement);
            this.$element.off('focus', this._focusElement);
            this.$element.off('blur', this._blurElement);

            this.$textspan.off('click');
            this.$textspan.off('mousedown');

            this.$dropdown.off('click');
            this.$dropdown.off('mousedown');

            if (this.$province) {
                this.$province.off(EVENT_CHANGE, this._changeProvince);
            }

            if (this.$city) {
                this.$city.off(EVENT_CHANGE, this._changeCity);
            }
        },

        getElement:function(){
            return $(document).find('.dropdown-picker[data-from="'+this.$element.attr('name')+'"]');
        },

        refresh: function (force) {
            var $this = this;
            // clean the data-item for each $select
            // var $select = this.$dropdown.find('.dropdown-select');
            // $select.data('item', null);
            // // parse value from value of the target $element
            // var val = this.$element.val() || '';
            // val = val.split('/');
            // for(var level=1;level<=this.maxlevel;level++){
            //     if (val[level] && level < val.length) {
            //         this.data[level] = val[level];
            //     } else if (force) {
            //         this.data[level] = '';
            //     }
            //     this.output(level,0);
            // }
            // this.tab(1);

            var $select = this.$dropdown.find('.dropdown-select');
            var $tab = this.$dropdown.find('.dropdown-tab');
            var $values = this.$element.val();
            this['$tab_level_1'] = $tab.filter('[data-level="1"]');
            this['$select_level_1'] = $select.filter('.level_1');
            if ($values) {
                var level = 1;
                try{
                    switch ($this.options.type) {
                        case 'single':
                            // var level = 1;
                            // for(var level in this.data){
                            //     for(var parent_id in this.data[level]) {
                            //         for(var id in this.data[level][id]) {
                            //             if ($values == id) {
                            //                 this.tab(level,this.data[level][id].title);
                            //                 this.output(level,parent_id);
                            //             }
                            //         }
                            //
                            //     }
                            // }
                            var path = this.getPathByValue($values);
                            if ($.isEmptyObject(path)) {
                                this.output(1,0);
                                break;
                            }
                            for(var i in path){
                                var id = path[i].id,
                                    parent_id = path[i].parent_id,
                                    title = path[i].title;
                                if ($values != path[i].id) this.tab(level,title);
                                this.output(level,parent_id);

                                var $select = $this.getElement().find('.dropdown-select.level_'+level);
                                $this.choicepath[level] = level;
                                $select.data('item', $this.data[level][parent_id][id]);
                                $select.find('a[data-id="'+id+'"]').addClass('active');

                                if (!$this.data[level+1] || !$this.data[level+1][path[i].id]) $this.choiced_minimal_level = true;
                                level++;
                            }
                            break;
                        case 'path':
                            var ids = $values.split(',');
                            if (ids.length>0) {
                                var latestid = ids[ids.length-1];
                                ids.forEach(function(id) {
                                    var item = $this.datalist[id];
                                    var parent_id = item.parent_id,
                                        title = item.title;
                                    if (latestid != id) $this.tab(level,title);
                                    $this.output(level,parent_id);
                                    var $select = $this.getElement().find('.dropdown-select.level_'+level);
                                    $this.choicepath[level] = level;
                                    $select.data('item', $this.data[level][parent_id][id]);
                                    $select.find('a[data-id="'+id+'"]').addClass('active');

                                    if (!$this.data[level+1] || !$this.data[level+1][item.id]) $this.choiced_minimal_level = true;
                                    level++;
                                });
                            } else {
                                $this.output(1,0);
                            }
                            break;
                        default : $this.output(1,0);
                    }

                    $this.feedText();
                }catch (e){
                    $this.removeNextLvel(2);
                    for (var i=2;i<=level;i++){
                        var $select = $this.getElement().find('.dropdown-select.level_'+i).data('item',null);
                        $select.find('a').removeClass('active');
                    }
                    $this.getElement().find('.dropdown-select.level_1').show();
                    $this.output(1,0);
                }
            } else {
                $this.output(1,0);
            }
            // this.feedText();
            // this.feedVal();
        },

        output: function (level,parent_id) {
            var options = this.options;
            var $select = this.getElement().find('.dropdown-select').filter('.level_' + level + '');
            var $tab = this.$dropdown.find('.dropdown-tab');
            var data = this.data[level];

            if (!$select || !$select.length) {
                return;
            }
            $select.html(this.getList(data[parent_id], level));
        },

        open: function (id) {
            this.$dropdown.show();
            this.$textspan.addClass('open').addClass('focus');
        },

        close:function(){
            this.$dropdown.hide();
            this.$textspan.removeClass('open');
            if (blur) {
                this.$textspan.removeClass('focus');
            }
        },

        tab: function (level,title) {
            var $next_level = level+1;
            var $tab = this['$tab_level_' + $next_level];
            var $select = this['$select_level_' + $next_level];
            var $tab_pre = this['$tab_level_' + level];
            var $select_pre = this['$select_level_' + level];

            if(!$tab || !$tab.length) {
                $tab = this['$tab_level_' + $next_level] = $('<a class="dropdown-tab"  data-level="'+$next_level+'">'+title+'</a>');
                $tab.insertAfter($tab_pre);
            }
            if(!$select || !$select.length) {
                $select = this['$select_level_' + $next_level] = $('<div class="dropdown-select level_'+$next_level+'" data-level="'+$next_level+'"></div>');
                $select.insertAfter($select_pre);
            }
            $tab.html(title);

            var $selects = this.getElement().find('.dropdown-select');
            var $tabs = this.getElement().find('.dropdown-tab');
            if ($select) {
                $.each($selects,function() {
                    $(this).hide();
                });
                $.each($tabs,function() {
                    $(this).removeClass('active');
                });
                $select.show();
                $tab.addClass('active');
            }
        },

        reset: function () {
            this.$element.val(null).trigger('change');
        },

        destroy: function () {
            this.unbind();
            this.$element.removeData(NAMESPACE).removeClass('dropdown-picker-input');
            this.$textspan.remove();
            this.$dropdown.remove();
        },

        getPathByValue:function(value) {
            var $this = this;
            var path = {};
            var _getItem = function(data,value) {
                for(var i in data){
                    if (data[i].sub && data[i].sub.length > 0) {
                        if(_getItem(data[i].sub,value)){
                            var _data = {};
                            _data = $.extend(true,_data,data[i]);
                            delete _data.sub;
                            path[data[i].id] = _data;
                            return true;
                        }
                    } else {
                        if (data[i].id == value) {
                            path[data[i].id] = data[i];
                            return true;
                        }
                    }
                }
            };
            _getItem($this.options.data,value);
            return path;
        },

        makeData:function(level,data,parent_id) {
            var $picker = this;
            level = (level ? level : $picker.maxlevel);
            data = (data && data.length > 0 ? data : this.options.data);
            parent_id = (parent_id ? parent_id : 0);
            $.each(data, function(){
                var $this = this;
                if (!$picker.data.hasOwnProperty(level)) {
                    $picker.data[level] = {};
                }
                if (!$picker.data[level].hasOwnProperty(parent_id)) {
                    $picker.data[level][parent_id] = {};
                }
                this.parent_id = parent_id;
                var _data = {};
                _data = $.extend(true,_data,this);
                delete _data.sub;
                $picker.data[level][parent_id][this.id] = _data;
                _data.level = level;
                $picker.datalist[_data.id] = _data;
                if ($this.sub && $this.sub.length > 0) {
                    $picker.maxlevel = level+1;
                    $picker.makeData(level+1,$this.sub,$this.id);
                }
            });
        },

        getList: function (data, level) {
            var list = [],
                $this = this;
            list.push('<dl class="clearfix"><dd>');
            $.each(data, function (i, n) {
                list.push(
                    '<a' +
                    ' title="' + (n.title || '') + '"' +
                    ' data-id="' + (n.id || '') + '"' +
                    ' data-parent_id="' + ($.isNumeric(n.parent_id) ? n.parent_id : '') + '"' +
                    ' data-level="' + level + '"' +
                    ' data-title="' + n.title + '"' +
                    ' class="' +
                    (n.selected ? ' active' : '') +
                    '">' + n.title +
                    '</a>');
            });
            list.push('</dd></dl>');

            return list.join('');
        },

        getSize: function ($dom) {
            var $wrap, $clone, sizes;
            if (!$dom.is(':visible')) {
                $wrap = $("<div />").appendTo($("body"));
                $wrap.css({
                    "position": "absolute !important",
                    "visibility": "hidden !important",
                    "display": "block !important"
                });

                $clone = $dom.clone().appendTo($wrap);

                sizes = {
                    width: $clone.outerWidth(),
                    height: $clone.outerHeight()
                };

                $wrap.remove();
            } else {
                sizes = {
                    width: $dom.outerWidth(),
                    height: $dom.outerHeight()
                };
            }

            return sizes;
        },

        getPosition: function () {
            var p, h, w, s, pw;
            p = this.$element.position();
            s = this.getSize(this.$element);
            h = s.height;
            w = s.width;
            if (this.options.responsive) {
                pw = this.$element.offsetParent().width();
                if (pw) {
                    w = w / pw;
                    if (w > 0.99) {
                        w = 1;
                    }
                    w = w * 100 + '%';
                }
            }

            return {
                top: p.top || 0,
                left: p.left || 0,
                height: h,
                width: w
            };
        },

        getWidthStyle: function (w, dropdown) {
            // return 'width:100%;';
            if (this.options.responsive && !$.isNumeric(w)) {
                return 'width:' + w + ';';
            } else {
                return 'width:' + (dropdown ? Math.max(320, w) : w) + 'px;';
            }
        }
    };

    // Register as jQuery plugin
    $.fn.DPiker = function (option) {
        var args = [].slice.call(arguments, 1);

        return this.each(function () {
            var $this = $(this);
            var data = $this.data(NAMESPACE);
            var options;
            var fn;

            if (!data) {
                if (/destroy/.test(option)) {
                    return;
                }

                options = $.extend({}, $this.data(), $.isPlainObject(option) && option);
                $this.data(NAMESPACE, (data = new DropdownPicker(this, options)));
            }

            if (typeof option === 'string' && $.isFunction(fn = data[option])) {
                fn.apply(data, args);
            }
        });
    };

});