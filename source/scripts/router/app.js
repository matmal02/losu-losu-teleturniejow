define(["backbone", "jquery", "chance", "moment", "underscore", "palette", "scripts/views/wheel", "scripts/collections/google_sheets_v4_wheel_collection"],
    function(Backbone, $, Chance, moment, _, palette, Wheel, GoogleSheetsV4WheelCollection) {

        var App = Backbone.Router.extend({

            routes: {
                "wheel/*options": "wheel"
            },

            /**
             * @param options String - String of the form [key:value[;key:value...]]
             */
            wheel: function(options) {
                // --- 1. Decode URI in case URL is encoded ---
    options = decodeURIComponent(options || "");

    // --- 2. Robust wheel_config parser ---
    var wheel_config = {};
    options.split(';').forEach(function(el) {
        if (!el) return;
        var idx = el.indexOf(':');
        if (idx < 0) return; // skip if no colon found
        var key = el.substring(0, idx).trim();
        var value = el.substring(idx + 1).trim();
        if (key) wheel_config[key] = value;
    });

    console.log("Parsed wheel_config:", wheel_config);

    // --- 3. Random number generator ---
    var rng;
    if (wheel_config.random === "date") {
        rng = _.constant(new Chance(Math.floor(moment.duration(moment().valueOf()).asDays())).random());
    } else if (/^\d+(\.\d+)?$/.test(wheel_config.random)) {
        var const_random = parseFloat(wheel_config.random);
        rng = _.constant(const_random);
    } else {
        var chance = new Chance();
        rng = function() { return chance.random(); };
    }

    // --- 4. Color scheme ---
    var color_brewer = function(number) {
        var scheme = wheel_config.color_scheme || "tol-rainbow";
        return palette([scheme], number);
    };

    // --- 5. Fallback if data is missing ---
    if (!wheel_config.data || !wheel_config.data.trim()) {
        console.warn("wheel_config.data is missing, using default dataset");

        var collection = new WheelCollection([
            { label: "A", fitness: 1 },
            { label: "B", fitness: 1 },
            { label: "C", fitness: 1 }
        ]);

        var wheel = new Wheel({
            el: $("#wheel"),
            collection: collection,
            random: rng,
            color_brewer: color_brewer
        });

        wheel.populate();
        return;
    }

    // --- 6. Google Sheets loader ---
    if (/^google_sheet/.test(wheel_config.data.trim())) {
        require(['scripts/collections/google_sheets_v4_wheel_collection'], function(GoogleSheetsV4WheelCollection) {
            var match = /^google_sheet,(.+)/.exec(wheel_config.data.trim());
            if (!match) return console.warn("Invalid google_sheet format:", wheel_config.data);

            var options_array = match[1].split(',').map(function(s){ return s.split('='); });
            var want = {};
            options_array.forEach(function(pair) {
                if (pair.length === 2) want[pair[0]] = pair[1];
            });

            var spreadsheet_id = want.id;
            var api_key = want.api_key;

            if (!spreadsheet_id || !api_key) {
                console.warn("Missing spreadsheet_id or api_key");
                return;
            }

            var collection = new GoogleSheetsV4WheelCollection([], {
                spreadsheet_id: spreadsheet_id,
                api_key: api_key
            });

            var wheel = new Wheel({
                el: $("#wheel"),
                collection: collection,
                random: rng,
                color_brewer: color_brewer
            });

            wheel.populate();
        });
    } else {
        console.warn("Not implemented data type:", wheel_config.data);
    }
            }
        });

        return App;
    }
);