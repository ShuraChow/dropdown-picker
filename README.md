# dropdown-picker

> A simple dropdown menu plugin based on jQuery plugin for customize mutil categroy.

> inspiration from [city-picker](https://github.com/tshi0912/city-picker)

## [Demo](https://shurachow.github.io/dropdown-picker)

## Getting started

```html
<script src="/path/to/jquery.js"></script><!-- jQuery is required -->
<script src="/path/to/dropdown-picker.js"></script>

<input readonly type="text" name="text">

<script>
$(document).ready(function() {
  var data = [{
      'id':1,
      'title':'a',
      'sub':[
          {
              'id':2,
              'title':'b'
          }
      ]
  }];
  $('input[name="text"]').DPiker({
      'data':data
  });
});
</script>

```

## TODO 

> - Category search
> - any category selection
> - etc.

## License

[MIT](http://opensource.org/licenses/MIT)