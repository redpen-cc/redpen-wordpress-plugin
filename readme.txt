# RedPen WordPress plugin
Contributors: redpen, takahi-i
Donate link: https://donate.doctorswithoutborders.org/
Tags: validation
Requires at least: 4.0
Tested up to: 4.4.1
License: GPLv3 or later
License URI: http://www.gnu.org/licenses/gpl-3.0.html
Stable tag: 1.0

This plugin integrates RedPen text validation into the WordPress editor.

## Description

[RedPen](http://redpen.cc) is a proofreading tool to help writers or programmers who write technical documents or manuals that need to adhere to a writing standard.
This plugin integrates text validation provided by [RedPen Server](http://redpen.cc/docs/latest/index.html#server) into the WordPress editor.

### Features

* Validates text with RedPen as you type
* Supports both Visual and Text WordPress editors
* Validation errors are marked in Visual editor in-place
* Validation error messages are also listed below and highlighted in the editor on click
* Autodetection of supported languages and variants (currently, English or Japanese)
* RedPen [validators](http://redpen.cc/docs/latest/index.html#validator) and [symbols](http://redpen.cc/docs/latest/index.html#setting-symbols) 
  can be configured directly in WordPress panel below the editor
* Configuration is stored for next visit with the same browser

## Screenshots

![screenshot](screenshot.png)

## Installation

By default, the plugin will use public RedPen installation at https://redpen.herokuapp.com/ for validation. 
See below if you want to use your own installation of [RedPen Server](http://redpen.cc/docs/latest/index.html#server). 

* Make sure PHP cURL library is available for WordPress, e.g. on Ubuntu install it with `sudo apt-get install php5-curl`
* [Download](https://github.com/redpen-cc/redpen-wordpress-plugin/archive/master.zip) and extract plugin files 
  to WordPress subdirectory `/wp-content/plugins/redpen`, or install the plugin through the WordPress plugins screen directly.
* Activate the plugin in WordPress Admin console -> Plugins -> Installed plugins.

### Using an own instance of RedPen Server

If you are uncomfortable sending your text for validation to an external server, you can use your own instance.

To use the plugin, you need to have **RedPen Server** v1.4.4 or newer running on the same machine as WordPress or accessible from it.
Please refer to [RedPen Server documentation](http://redpen.cc/docs/latest/index.html#server) for more details on how to start it.

Then, define the correct RedPen server URL in **config.php**. By default, local RedPen Server will respond at `http://localhost:8080/`.

## Frequently Asked Questions ##

None yet

## Changelog

### 1.0

* Added in-place highlighting and RedPen configuration
* Use public RedPen Server installation by default for ease of installation

### 0.1

* Initial version

## Upgrade Notice

None
