<!DOCTYPE html>
<html>
<head>
	<title>Losu losu losu</title>	
	<link rel="stylesheet" type="text/css" href="<%- baseUrl %>style/style.css">
	<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<div id="content">
	<div id="header">
		<h1>Losu losu losu</h1>
	</div>
	<div id="wheel">
		<canvas width="640" height="640">
		Sorry, your browser does not support HTML5 Canvas!
		</canvas>
		<div class="canvas-label">Kliknij na koło by zakręcić</div>
	</div>
	<footer>
		<div>Created by <a href="https://github.com/matmal02">matmal02</a>. Based on <a href="github.com/hoesler/wheel-of-fortune">wheel-of-fortune</a> app by <a href="github.com/hoesler">Christoph Hoesler</a>.</div>
	</footer>
</div>
</body>
<script src="<%- baseUrl %>scripts/router/app.js"></script>
<script type="text/javascript">
	require(["backbone", "scripts/router/app"],
		function(Backbone, App) {
			var app = new App();
			app.route('', 'init', function() {
				app.navigate("<%- initialRoute %>", {trigger: true});
			});
			Backbone.history.start({pushState: true, root: "<%- baseUrl %>"});	
		}
	);
</script>
</html>
