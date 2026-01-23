define(["backbone", "underscore", "scripts/models/wheel_element", "chance"],
    function(Backbone, _, WheelElement, Chance) {

        var GoogleSheetsV4WheelCollection = Backbone.Collection.extend({

            model: WheelElement,

            initialize: function(models, options) {
                this.url = 'https://sheets.googleapis.com/v4/spreadsheets/' + options.spreadsheet_id + '/values/TYLKO Całe Odcinki!A2:H?key=' + options.api_key;
                this.syncEnabled = options.syncEnabled !== false;
                this.selectedTypes = options.selectedTypes || [];
                this.allTypes = [];
                this.allElements = []; // Store all elements before filtering
            },

            parse: function(response, options) {
                var models = [];
                this.allElements = [];

                var elements = new Chance(33).shuffle(response.values); // fixed shuffle
                _.each(elements, function(element) {
                    var label = element[0] + " (" + element[1] + ")";
                    var fitness = 10;
                    var link = element[5];
                    var watched = element[6];
                    var type_array = element[7] ? element[7].split(",").map(function(t) { return t.trim(); }) : [];

                    const d = new Date();
                    const years = element[1].split("-");
                    years.sort((a,b) => b-a);
                    const year = years[0];

                    // Track all available types
                    _.each(type_array, function(type) {
                        if (type && !_.contains(this.allTypes, type)) {
                            this.allTypes.push(type);
                        }
                    }, this);

                    // Store all elements (before filtering)
                    if (!(this.syncEnabled && (watched === "TRUE" || d.getFullYear() - year < "7"))) {
                        this.allElements.push({
                            label: label,
                            fitness: fitness,
                            link: link,
                            types: type_array
                        });
                    }

                    if (this.syncEnabled && (watched === "TRUE" || d.getFullYear() - year < "7")) return;
                    
                    // Filter by selected types - exclude items that match selected types
                    if (this.selectedTypes.length > 0 && !type_array.some(type => this.selectedTypes.includes(type))) return;

                    if (fitness > 0) {
                        models.push({
                            label: label,
                            fitness: fitness,
                            link: link,
                            types: type_array
                        });
                    }
                }, this);

                // Sort allTypes for consistent display
                this.allTypes.sort();

                return models;
            },

            getAvailableTypes: function() {
                return this.allTypes;
            },

            filterByTypes: function(selectedTypes) {
                this.selectedTypes = selectedTypes;
                this.fetch({ reset: true });
            }
        });

        return GoogleSheetsV4WheelCollection;
    });