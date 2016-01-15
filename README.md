[![Build Status](https://travis-ci.org/redpen-cc/redpen-wordpress-plugin.svg?branch=master)](https://travis-ci.org/redpen-cc/redpen-wordpress-plugin)

# A plugin that integrates RedPen validation into Wordpress (in development)

## Prerequisites

To use the plugin, you need to have RedPen Server instance running on the same machine.
Please refer to [RedPen Server documentation](http://redpen.cc/docs/latest/index.html#server) for more details.

## Installation

* To install the plugin, either link or copy this directory to *wordpress/wp-content/plugins*.
* Then activate the plugin in the Admin console -> Plugins -> Installed plugins.
* Make sure the correct RedPen server URL is defined in *config.php*.

## Dependencies

* Obviously, you will need PHP
* php-curl is required for proxy.php, you can install it on Ubuntu with
  
    ```sudo apt-get install php5-curl``` 

### Running the tests

* PHP unit tests are run using **[phpunit](https://phpunit.de/manual/current/en/installation.html)**, it can also be installed with *apt-get*

    ```phpunit tests-php```
    
* JavaScript unit tests are run using Karma.
 
    ```npm install && npm test``` will run Karma using PhantomJS

See .travis.yml for an example how tests are run on a Continuous Integration server.
