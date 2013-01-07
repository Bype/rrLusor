var page = require('webpage').create();
page.paperSize = page.viewportSize = {
		width : 1920,
		height : 1080
	}; 
page.open('http://lusor.bype.org/les_quatres_sans_cou_robert_desnos', function () {

	
    page.render('/tmp/lusor.png');
    phantom.exit();
});