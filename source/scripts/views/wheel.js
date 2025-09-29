define(["jquery", "moment", "underscore", "scripts/helper/math", "backbone", "scripts/collections/google_sheets_v4_wheel_collection", "scripts/models/wheel_element"],
    function($, moment, _, math, Backbone, GoogleSheetsV4WheelCollection, WheelElement) {

        var Wheel = Backbone.View.extend({
            events: {
                "click canvas": "spin"
            },

            populate: function() {
                this.render_info("Loading data...");
                var self = this;
                this.collection.fetch({
                    reset: true,
                    error: function() {
                        self.render_info("Error: Failed to load data");
                    }
                });
            },

            initialize: function(options) {
                options = typeof options !== 'undefined' ? options : {};
                this.random = typeof options.random !== 'undefined' ? options.random : Math.random;
                this.animation_duration = typeof options.animation_duration !== 'undefined' ? options.animation_duration : 10000; // ms
                this.color_brewer = typeof options.color_brewer !== 'undefined' ? options.color_brewer : function(number) {
                    return _.map(new Array(number), _.constant("#000000"));
                };
                this.fps = typeof options.fps !== 'undefined' ? options.fps : 60;

                this.$wheel_canvas = this.$el.find("canvas").first();
                this.wheel_canvas = this.$wheel_canvas.get(0);

                this.reset();
                this.collection.on("reset", this.reset, this);

                if ($("#wheel-popup").length === 0) {
    $("body").append(`
        <div id="wheel-popup" 
             style="
                display:none; 
                position:fixed; 
                top:40%; 
                left:50%; 
                transform:translate(-50%,-50%) scale(0.5); 
                background:#333; 
                color:#fff; 
                border:2px solid #000; 
                padding:20px; 
                font-size:18px; 
                z-index:1000; 
                text-align:center; 
                border-radius:8px;
                transition: transform 0.3s ease, opacity 0.3s ease;
             ">
        </div>
    `);
}

            },

            reset: function(collection, options) {
                // TODO: wait for active animation to stop
                var fitness_values = this.collection.map(function(wheel_element) {
                    return wheel_element.get("fitness");
                });
                var fitness_sum = _.reduce(fitness_values, function(sum, n) { return sum + n; }, 0);

                if (fitness_sum !== 0) {
                    var label_values = this.collection.map(function(wheel_element) {
                        return wheel_element.get("label");
                    });

                    var colors = this.color_brewer(this.collection.size());

                    this.arc_widths = _.map(fitness_values, function(fitness) {
                        return fitness / fitness_sum * Math.TWO_PI;
                    });
                    this.labels = label_values;
                    this.colors = colors;
                } else {
                    this.arc_widths = [];
                    this.labels = [];
                    this.colors = [];
                }

                // resize canvas
                var canvas_el = this.$wheel_canvas;
                var canvas = this.wheel_canvas;

                var bounding_rect_width = Math.min(canvas.width, canvas.height);
                this.wheel_margin = 20;
                this.wheel_radius = bounding_rect_width / 2 - this.wheel_margin;

                this.wheel_image = this.create_wheel_image();
                this.render();

                canvas_el.addClass("clickable");

                this.$el.show();

                this.trigger("ready");
            },

            create_wheel_image: function() {
                var canvas = document.createElement('canvas');

                canvas.width = this.wheel_radius * 2;
                canvas.height = this.wheel_radius * 2;

                var ctx = canvas.getContext("2d");

                var wheel_center_x = this.wheel_radius;
                var wheel_center_y = this.wheel_radius;

                ctx.translate(wheel_center_x, wheel_center_y);
                ctx.translate(-wheel_center_x, -wheel_center_y);

                var acr_start = 0;

                for (var i = 0; i < this.arc_widths.length; i++) {
                    ctx.fillStyle = "#" + this.colors[i];
                    ctx.beginPath();
                    ctx.moveTo(wheel_center_x, wheel_center_y);
                    var arc_end = acr_start + this.arc_widths[i];
                    ctx.arc(wheel_center_x, wheel_center_y, this.wheel_radius, acr_start, arc_end, false);
                    ctx.lineTo(wheel_center_x, wheel_center_y);
                    ctx.fill();

                    ctx.save();
                    var adjacent = Math.cos(acr_start + (arc_end - acr_start) / 2) * (this.wheel_radius - 10);
                    var opposite = Math.sin(acr_start + (arc_end - acr_start) / 2) * (this.wheel_radius - 10);
                    ctx.translate(wheel_center_x + adjacent, wheel_center_y + opposite);
                    ctx.rotate(acr_start + (arc_end - acr_start) / 2);

                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "right";
                    ctx.textBaseline = "middle";
                    ctx.font = window.devicePixelRatio * 10 + "px Arial";
                    ctx.fillText(this.labels[i], 0, 0);

                    ctx.restore();

                    acr_start = arc_end;
                }

                return canvas;
            },

            render: function(rotation) {
                rotation = typeof rotation !== 'undefined' ? rotation : 0;

                var canvas = this.wheel_canvas;
                var ctx = canvas.getContext("2d");
                var pixel_ratio = window.devicePixelRatio;

                width = Math.min(Math.max(Math.min(window.innerWidth, window.innerHeight), 320), 400);
                height = width;

                canvas.width = width * pixel_ratio;
                canvas.height = height * pixel_ratio;
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';

                var wheel_center_x = this.wheel_margin + this.wheel_radius;
                var wheel_center_y = this.wheel_margin + this.wheel_radius;

                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.translate(wheel_center_x, wheel_center_y);
                ctx.rotate(rotation);
                ctx.translate(-wheel_center_x, -wheel_center_y);
                ctx.drawImage(this.wheel_image, this.wheel_margin, this.wheel_margin);
                ctx.restore();

                ctx.beginPath();
                ctx.moveTo(wheel_center_x + this.wheel_radius - 5, wheel_center_y);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 6;
                ctx.lineTo(wheel_center_x + this.wheel_radius + 50, wheel_center_y);
                ctx.stroke();

                ctx.scale(pixel_ratio, pixel_ratio);
            },

            /**
             * Spin the wheel
             * @param {Function} after - A callback which gets called at the end of the animation
             */
            render_spin: function(after) {
                after = typeof after !== 'undefined' ? after : _.noop();

                var self = this;

                var index = math.roulette_wheel_selection(self.arc_widths, self.random);
                var partial_exclusive = _.reduce(self.arc_widths.slice(0, index), Math.sum, 0);
                var partial_inclusive = partial_exclusive + self.arc_widths[index];
                var angle_selected = partial_exclusive + (partial_inclusive - partial_exclusive) / 2;
                var full_rotations = 10;
                var rotation_max = Math.TWO_PI * full_rotations + (Math.TWO_PI - angle_selected);

                function easeOutCirc(t, b, c, d) {
                    return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
                }

                var animation_start = moment();
                var animation_interval = setInterval(function() {
                    var time = moment().diff(animation_start);
                    var easing = easeOutCirc(time, 0, rotation_max, self.animation_duration);
                    var rotation = easing % Math.TWO_PI;
                    self.render(rotation);
                }, Math.min(1, Math.round(1000 / this.fps)));

                setTimeout(function() {
                    clearInterval(animation_interval);
                    var selected_label = self.labels[index];
var selected_color = self.colors[index]; // slice color
self.showResultPopup(selected_label, selected_color);
                    after();
                }, self.animation_duration);
            },

            showResultPopup: function(label, color) {
    var popup = $("#wheel-popup");
    popup.text("Selected: " + label);

    // Compute brightness of hex color
    var hex = color.replace(/^#/, '');
    var r = parseInt(hex.substr(0,2),16);
    var g = parseInt(hex.substr(2,2),16);
    var b = parseInt(hex.substr(4,2),16);
    var brightness = (r*299 + g*587 + b*114)/1000;
    var textColor = brightness > 128 ? "#000" : "#fff";

    // Set popup background and text color
    popup.css({ 
        background: "#" + color, 
        color: textColor, 
        display: "block",
        transform: "translate(-50%,-50%) scale(0.5)",
        opacity: 0
    });

    // Animate scale & fade-in
    setTimeout(() => {
        popup.css({ transform: "translate(-50%,-50%) scale(1)", opacity: 1 });
    }, 10);

    // Remove previous click handler
    popup.off("click");

    // Dismiss on click anywhere
    $(document).one("click", () => {
        popup.css({ transform: "translate(-50%,-50%) scale(0.5)", opacity: 0 });
        setTimeout(() => popup.css({ display: "none" }), 300);
    });
},


            render_info: function(message) {
                var canvas = this.wheel_canvas;
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.fillText(message, canvas.width / 2, canvas.height / 2);
            },

            spin: function() {
                var el = this.$el.find("canvas").first();
                if (!el.hasClass("clickable")) {
                    return;
                }
                el.removeClass("clickable");

                this.render_spin(function() {
                    el.addClass("clickable");
                });
            }
        });

        return Wheel;
    });