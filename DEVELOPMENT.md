## For developers [![Build Status](https://travis-ci.org/redpen-cc/redpen-wordpress-plugin.svg?branch=master)](https://travis-ci.org/redpen-cc/redpen-wordpress-plugin)

### Running the tests

* Install all required dependencies using npm (Karma, Jasmine, PHPUnit):

    ```npm install```

* All unit tests (JavaScript and PHP) can then be run with

    ```npm test```
    
JavaScript tests will be run in PhantomJS by default. You can change the browser in *tests-js/karma.conf.js*.

### Configuring IntelliJ IDEA

To make development easier, preconfigured IntelliJ IDEA or PHPStorm project files are already in this repository.

Install the following plugins:

* PHP (if using IDEA)
* Karma

Run configurations are also provided for running of unit tests.
