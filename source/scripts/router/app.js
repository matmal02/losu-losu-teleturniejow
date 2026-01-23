define(["backbone", "underscore", "palette", "scripts/views/wheel", "scripts/collections/google_sheets_v4_wheel_collection", "scripts/config/sheetConfig"],
function(Backbone, _, palette, Wheel, GoogleSheetsV4WheelCollection, sheetConfig) {

    var App = Backbone.Router.extend({
        routes: {
            "wheel/*options": "wheel"
        },

        wheel: function(options) {
            options = decodeURIComponent(options || "");
            var wheel_config = {};
            
                
                options.split(';').forEach(function(el) {
                    if (!el) return;
                    var idx = el.indexOf(':');
                    if (idx < 0) return;
                    var key = el.substring(0, idx).trim();
                    var value = el.substring(idx + 1).trim();
                    if (key) wheel_config[key] = value;
                });


            var rng = Math.random;
            if (wheel_config.random === "date") {
                rng = _.constant(new Chance(Math.floor(moment.duration(moment().valueOf()).asDays())).random());
            } else if (/^\d+(\.\d+)?$/.test(wheel_config.random)) {
                rng = _.constant(parseFloat(wheel_config.random));
            } else {
                var chance = new Chance();
                rng = function(){ return chance.random(); };
            }

            var color_brewer = function(number) {
                var scheme = wheel_config.color_scheme || "tol-rainbow";
                return palette([scheme], number);
            };

            // Use config instead of dotenv or URL keys
            var sheetKey = wheel_config.sheet || "losulosu";
            var sheetInfo = sheetConfig[sheetKey];

            var collection;
            if (sheetInfo) {
                collection = new GoogleSheetsV4WheelCollection([], {
                    spreadsheet_id: sheetInfo.spreadsheet_id,
                    api_key: sheetInfo.api_key
                });
            } else {
                console.warn("No sheet config found; using fallback dataset.");
                collection = new Backbone.Collection([
                    { label: "A", fitness: 1 },
                    { label: "B", fitness: 1 },
                    { label: "C", fitness: 1 }
                ]);
            }

            var wheel = new Wheel({
                el: $("#wheel"),
                collection: collection,
                random: rng,
                color_brewer: color_brewer
            });

            // Store wheel instance globally for access from HTML onclick handlers
            window.currentWheelInstance = wheel;
            window.showUpdatePopupGlobal = function() {
                console.log("showUpdatePopupGlobal called, wheel instance:", window.currentWheelInstance);
                if (window.currentWheelInstance) {
                    console.log("Calling showUpdatePopup...");
                    window.currentWheelInstance.showUpdatePopup();
                }
            };

            wheel.populate();
        }
    });

    return App;
});
