# mobile-charts

Provide convenience wrappers (around `jquery.flot`) for plotting consumption-related measurements on a mobile device.

## Quickstart 

Install Grunt globally:

    sudo npm install -g grunt-cli
    
Install all project dependencies:

    npm install

Build and deploy (locally):

    grunt build
    grunt deploy --prefix ~/var/www/charts

Launch a watch task (foreground) to build when source changes:

    grunt watch:charts --prefix ~/var/www/charts/

Build documentation

    grunt jsdoc
 
## Documentation

The documentation is generated from sources using JsDoc. The current documentation (for `master` branch) can be found at http://daiad.github.io/mobile-charts/doc.
