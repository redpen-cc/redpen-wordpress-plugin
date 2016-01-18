[![Build Status](https://travis-ci.org/redpen-cc/redpen-wordpress-plugin.svg?branch=master)](https://travis-ci.org/redpen-cc/redpen-wordpress-plugin)

# WordPress plugin that integrates RedPen text validation into the editor

## Prerequisites

To use the plugin, you need to have RedPen Server instance running on the same machine.
Please refer to [RedPen Server documentation](http://redpen.cc/docs/latest/index.html#server) for more details.

## Installation

Before installing make sure that your WordPress is up and running properly.

* Either link or copy this directory to *wordpress/wp-content/plugins*, e.g.
    ```ln -s redpen-wordpress-plugin wordpress/wp-content/plugins```

* Make sure the correct RedPen server URL is defined in *config.php*.
* Install PHP cURL library if you don't already have it, e.g. on Ubuntu
    ```sudo apt-get install php5-curl```

* Activate the plugin in WordPress Admin console -> Plugins -> Installed plugins.

## For developers

### Running the tests

* Install all required dependencies using npm (Karma, Jasmine, PHPUnit):

    ```npm install```

* All unit tests (JavaScript and PHP) can then be run with

    ```npm test```
    
JavaScript tests will be run in PhantomJS by default. You can change the browser in *tests-js/karma.conf.js*.
