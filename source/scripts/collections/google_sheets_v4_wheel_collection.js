define(["backbone", "underscore", "scripts/models/wheel_element", "chance"],
    function(Backbone, _, WheelElement, Chance) {

        var GoogleSheetsV4WheelCollection = Backbone.Collection.extend({

            model: WheelElement,

            initialize: function(models, options) {
                this.url = 'https://sheets.googleapis.com/v4/spreadsheets/' + options.spreadsheet_id + '/values/TYLKO Całe Odcinki?key=' + options.api_key;
            },

            parse: function(response, options) {
                var models = [];

                var elements = new Chance(33).shuffle(response.values); // fixed shuffle
                _.each(elements, function(element) {
                    var label = element[0] + " (" + element[1] + ")";
                    var fitness = 10;
                    var link = element[5];
                    if (fitness > 0) {
                        models.push({
                            label: label,
                            fitness: fitness,
                            link: link
                        });
                    }
                }, this);

                return models;
            }
        });

        return GoogleSheetsV4WheelCollection;
    });