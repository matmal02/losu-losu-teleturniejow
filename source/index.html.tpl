<!DOCTYPE html>
<html>
<head>
	<title>Losu losu losu</title>	
	<link rel="stylesheet" type="text/css" href="<%- baseUrl %>style/style.css">
	<link rel="icon" type="image/x-icon" href="<%- baseUrl %>assets/favicon.ico">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&family=Lato&family=Lexend:wght@100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet">
</head>
<body>
<div id="content">
	<header>
		<h1>Losu losu losu</h1>
	</header>
	<div id="wheel">
		<canvas width="640" height="640">
		Sorry, your browser does not support HTML5 Canvas!
		</canvas>
		<div class="canvas-label">Kliknij koło, by zakręcić</div>
	</div>
	<footer>
		<div>Created by <a href="https://github.com/matmal02">matmal02</a>. Based on <a href="https://github.com/hoesler/wheel-of-fortune">wheel-of-fortune</a> app by <a href="https://github.com/hoesler">Christoph Hoesler</a>.</div><br>
		<a href="https://suppi.pl/matmal02" target="_blank"><img width="165" src="https://suppi.pl/api/widget/button.svg?fill=6457FD&textColor=ffffff"/></a>
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
