
define(["jquery", "moment", "underscore", "scripts/helper/math", "backbone", "scripts/collections/google_sheets_v4_wheel_collection", "scripts/models/wheel_element"],
    function($, moment, _, math, Backbone, GoogleSheetsV4WheelCollection, WheelElement) {

        var Wheel = Backbone.View.extend({
            events: {
                "click canvas": "spin"
            },

            populate: function() {
                this.render_info("Loading data...");
                var self = this;
                this.collection.syncEnabled = this.syncEnabled;
                this.collection.fetch({
                    reset: true,
                    error: function() {
                        self.render_info("Error: Failed to load data");
                    },
                    success: function() {
                        if (!self.filtersRendered) {
                            self.renderTypeFilters();
                            self.filtersRendered = true;
                        }
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
                this.selectedTypes = [];
                this.filtersRendered = false;

                this.$wheel_canvas = this.$el.find("canvas").first();
                this.wheel_canvas = this.$wheel_canvas.get(0);

                this.reset();
                this.collection.on("reset", this.reset, this);

                var rand = Math.floor(Math.random() * 1000) + 1;
                if (rand > 150 && rand <= 200){
                    this.spinAudio = new Audio("/losu-losu-teleturniejow/sounds/spin2.mp3");
                }
                else
                {
                    this.spinAudio = new Audio("/losu-losu-teleturniejow/sounds/spin.mp3");
                }
                this.spinAudio.preload = "auto";
                this.spinAudio.loop = false;
                this.spinAudio.volume = 1;
                this.audioEnabled = true;
                this.syncEnabled = true;

                if ($("#wheel-audio-toggle").length === 0) {
    const container = $("<div>").css({ "text-align": "center", "margin-top": "10px" });
    
    const toggleBtn = $("<button>")
        .attr("id", "wheel-audio-toggle")
        .text("Audio: On")
        .css({
            padding: "8px 12px",
            fontSize: "14px",
            borderRadius: "4px",
            border: "none",
            background: "#444",
            color: "#fff",
            cursor: "pointer",
            marginRight: "10px"
        });

    const syncBtn = $("<button>")
    .attr("id", "wheel-sync-toggle")
    .text("Tryb streamowy: On")
    .css({
        padding: "8px 12px",
        fontSize: "14px",
        borderRadius: "4px",
        border: "none",
        background: "#444",
        color: "#fff",
        cursor: "pointer",
        marginLeft: "10px"
    });
    
    const volumeSlider = $("<input>")
        .attr({ type: "range", min: 0, max: 1, step: 0.01, value: this.spinAudio.volume })
        .attr("id", "wheel-audio-volume")
        .css({ verticalAlign: "middle" });
    
    container.append(toggleBtn, volumeSlider, syncBtn);
    this.$el.append(container);

    const self = this;
    toggleBtn.on("click", function() {
        self.toggleAudio();
        const vol = self.audioEnabled ? self.spinAudio.volume : 0;
        const toggleBtnText = vol === 0 ? "Audio: Off" : "Audio: On";
        $(this).text(toggleBtnText);
    });

    syncBtn.on("click", function () {
        self.syncEnabled = !self.syncEnabled;
        self.collection.syncEnabled = self.syncEnabled;
        const toggleBtnText = self.syncEnabled ? "Tryb streamowy: On" : "Tryb streamowy: Off";
        $(this).text(toggleBtnText);
        self.populate();
    });
    
    volumeSlider.on("input", function() {
        const vol = parseFloat($(this).val());
        self.spinAudio.volume = vol;

        // Update toggle button text based on volume
        const toggleBtnText = vol === 0 ? "Audio: Off" : "Audio: On";
        $("#wheel-audio-toggle").text(toggleBtnText);
    });
}


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

            renderTypeFilters: function() {
                var self = this;
                var types = this.collection.getAvailableTypes();

                if (types.length === 0) {
                    return; // No types to filter
                }

                // Remove existing filter container if present
                $("#wheel-type-filters").remove();

                const filterContainer = $("<div>")
                    .attr("id", "wheel-type-filters")
                    .css({
                        "margin-top": "15px",
                        "padding": "10px",
                        "background": "#171811",
                        "border-radius": "4px",
                        "border-style": "solid",
                        "border-color": "#f5f5f5",
                        "text-align": "left",
                        "max-width": "600px",
                        "margin-left": "auto",
                        "margin-right": "auto",
                        "position": "relative"
                    });

                const filterLabelContainer = $("<div>")
                    .css({
                        "display": "flex",
                        "justify-content": "space-between",
                        "align-items": "center",
                        "margin-bottom": "10px"
                    });

                const filterLabel = $("<label>")
                    .text("Wybierz kategorie teleturniejów, które chcesz mieć na kole")
                    .css({
                        "font-weight": "bold",
                        "color": "#f5f5f5"
                    });

                const helpText = $("<span>")
                    .text("Legenda")
                    .css({
                        "cursor": "pointer",
                        "color": "#f5f5f5",
                        "font-weight": "bold",
                        
                    })
                    .on("click", function() {
                        self.showFilterHelpPopup();
                    });

                filterLabelContainer.append(filterLabel, helpText);
                filterContainer.append(filterLabelContainer);

                const checkboxContainer = $("<div>")
                    .css({
                        "display": "flex",
                        "flex-wrap": "wrap",
                        "gap": "10px",
                    });

                _.each(types, function(type) {
                    const checkboxWrapper = $("<label>")
                        .css({
                            "display": "flex",
                            "align-items": "center",
                            "cursor": "pointer",
                            "user-select": "none",
                            "margin-top": "5px",
                            "margin-bottom": "5px"
                        });

                    const checkbox = $("<input>")
                        .attr({
                            type: "checkbox",
                            "class": "wheel-type-checkbox",
                            value: type
                        })
                        .prop("checked", true)
                        .css({
                            "margin-right": "6px",
                            "cursor": "pointer"
                        })
                        .on("change", function() {
                            self.onTypeFilterChange();
                        });

                    const label = $("<span>")
                        .text(type)
                        .css({
                            "font-size": "14px",
                            "font-weight": "bold",
                            "color": "#f5f5f5"
                        });

                    checkboxWrapper.append(checkbox, label);
                    checkboxContainer.append(checkboxWrapper);
                });

                filterContainer.append(checkboxContainer);

                // Find the audio/sync button container and insert filters after it
                var buttonContainer = $("#wheel-audio-toggle").closest("div");
                if (buttonContainer.length > 0) {
                    buttonContainer.after(filterContainer);
                } else {
                    this.$el.append(filterContainer);
                }
            },

            showUpdatePopup: function() {
                $("#wheel-update-popup").remove();

                const popup = $("<div>")
                    .attr("id", "wheel-update-popup")
                    .css({
                        "position": "fixed",
                        "top": "50%",
                        "left": "50%",
                        "background": "#333",
                        "color": "#fff",
                        "border": "2px solid #000",
                        "padding": "20px",
                        "font-size": "18px",
                        "z-index": "1000",
                        "text-align": "center",
                        "border-radius": "8px",
                        "transition": "transform 0.3s ease, opacity 0.3s ease",
                        "transform": "translate(-50%,-50%) scale(0.5)",
                        "opacity": "0"
                    });

                const headerContainer = $("<div>")
                    .css({
                        "display": "flex",
                        "justify-content": "space-between",
                        "align-items": "flex-start",
                        "margin-bottom": "10px"
                    });

                const closeBtn = $("<button>")
                    .text("×")
                    .css({
                        "background": "none",
                        "border": "none",
                        "color": "#f5f5f5",
                        "font-size": "24px",
                        "cursor": "pointer",
                        "padding": "0",
                        "width": "30px",
                        "height": "30px",
                        "display": "flex",
                        "align-items": "center",
                        "justify-content": "center"
                    })
                    .on("click", function() {
                        popup.css({ transform: "translate(-50%,-50%) scale(0.5)", opacity: 0 });
                        setTimeout(() => popup.remove(), 300);
                    });

                headerContainer.append(closeBtn);
                popup.append(headerContainer);

                const content = $("<div>")
                    .css({
                        "margin": "0",
                        "display": "block",
                        "text-align": "center"
                    })
                    .html("<h1> Wielki update losu losu teleturniejów! </h1>" +
                        "<p> Od teraz możesz wybrać jakie teleturnieje chcesz losować! </p>" +
                        "<p> Kliknij na 'Legenda' obok filtrów (pod kołem), by dowiedzieć się więcej </p>" +
                        "<p> Do tego po losowaniu wraz z nazwą i linkiem do teleturnieju wyświetli się też jego kategoria, byś wiedział czego się spodziewać </p>" +
                        "<p> Dodatkowo zmniejszyłem głośność muzyki, by nie waliła po uszach </p>" +
                        "<p> Jeśli podoba ci się moja praca, zapraszam do wsparcia mnie na Suppi, bym mógł się dalej rozwijać </p>" +
                        "<p><a href=\"https://suppi.pl/matmal02\" target=\"_blank\"><img width=\"165\" src=\"https://suppi.pl/api/widget/button.svg?fill=6457FD&amp;textColor=ffffff\"></a></p>"+
                        "<p style='font-size: 10px;'> pls jestem biedny student i do tego jestem taki malutki 👉👈 </p>" +
                        "<p> Miłego losowania!</p>");

                popup.append(content);
                $("body").append(popup);

                // Animate in
                setTimeout(() => { 
                    popup.css({ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }); 
                }, 10);
            },

            showFilterHelpPopup: function() {
                // Remove existing help popup if present
                $("#wheel-filter-help-popup").remove();

                const helpPopup = $("<div>")
                    .attr("id", "wheel-filter-help-popup")
                    .css({
                        "position": "fixed",
                        "top": "50%",
                        "left": "50%",
                        "background": "#333",
                        "color": "#fff",
                        "border": "2px solid #000",
                        "padding": "20px",
                        "font-size": "18px",
                        "z-index": "1000",
                        "text-align": "center",
                        "border-radius": "8px",
                        "transition": "transform 0.3s ease, opacity 0.3s ease",
                        "transform": "translate(-50%,-50%) scale(0.5)",
                        "opacity": "0"
                    });

                const headerContainer = $("<div>")
                    .css({
                        "display": "flex",
                        "justify-content": "space-between",
                        "align-items": "flex-start",
                        "margin-bottom": "10px"
                    });

                const title = $("<div>")
                    .text("Legenda")
                    .css({
                        "font-weight": "bold",
                        "font-size": "16px"
                    });

                const closeBtn = $("<button>")
                    .text("×")
                    .css({
                        "background": "none",
                        "border": "none",
                        "color": "#f5f5f5",
                        "font-size": "24px",
                        "cursor": "pointer",
                        "padding": "0",
                        "width": "30px",
                        "height": "30px",
                        "display": "flex",
                        "align-items": "center",
                        "justify-content": "center"
                    })
                    .on("click", function() {
                        helpPopup.css({ transform: "translate(-50%,-50%) scale(0.5)", opacity: 0 });
                        setTimeout(() => helpPopup.remove(), 300);
                    });

                headerContainer.append(title, closeBtn);
                helpPopup.append(headerContainer);

                const content = $("<p>")
                    .css({
                        "margin": "0",
                        "display": "flex",
                        "flex-wrap": "wrap",
                    }).innerHtml = "<p><b>Klasyczny</b> - teleturniej typu \"jaki jest, każdy widzi i nikt nie będzie tego, że jest teleturniejem, kwestionował\"</p>" +
                        "<p><b>Muzyczny</b> - teleturnieje, do których oglądania końmi Bartka nie zaciągniecie</p>" +
                        "<p><b>Interaktywny</b> - teleturniej typu \"widz dzwoni i gra w tetrisa czy co innego\"</p>" +
                        "<p><b>Call TV</b> - wyjeba typu \"ty się nie dodzwonisz, debil co powie 'Pokaż dupę' już tak, a osoba prowadząca się zastanawia, czemu nikt nie potrafi odpowiedzieć ile to jest 2+2\"</p>" +
                        "<p><b>Kulinarny</b> - teleturniej typu gotowanie (Tak, też nie wierzę, że coś takiego istnieje)</p>" +
                        "<p><b>Turniej w telewizji</b> - teleturniej w całkiem dosłownym tego słowa znaczeniu, czyli turnieje typu Dzień Sportu w szkole pokazywane w telewizji</p>" +
                        "<p><b>Program rozrywkowy</b> - program rozrywkowy z elementami teleturnieju, mniej lub bardziej skupiający się na aspekcie rozrywkowym (przede wszystkim wszelkie celebryckie zabawy) - program typu \"wy powiecie, że to nie teleturniej, a inni powiedzą, że to jest teleturniej\"</p>" +
                        "<p><b>Reality show</b> - reality show z elementami teleturnieju, mniej lub bardziej skupiający się na aspekcie reality show - program typu \"wy powiecie, że to nie teleturniej, a inni powiedzą, że to jest teleturniej\"</p>" +
                        "<p><b>Program randkowy</b> - teleturniej typu \"Szukam baby/chłopa, tam są trzy osoby, które będą o mnie walczyć (dosłownie, bądź w przenośni)\"</p>" +
                        "<p><b>Inny</b> - teleturniej, który nie pasuje do żadnej z powyższych kategorii, a jest ich za mało, by stworzyć nową :/</p>";

                helpPopup.append(content);
                $("body").append(helpPopup);

                // Animate in
                setTimeout(() => { 
                    helpPopup.css({ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }); 
                }, 10);
            },

            onTypeFilterChange: function() {
                var self = this;
                var selectedTypes = [];

                $(".wheel-type-checkbox:checked").each(function() {
                    selectedTypes.push($(this).val());
                });

                this.selectedTypes = selectedTypes;
                this.collection.selectedTypes = selectedTypes;

                console.log("Selected types:", selectedTypes);
                
                self.populate();
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
                    ctx.font = window.devicePixelRatio * 15 + "px Arial";
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

                width = Math.min(Math.max(Math.min(window.innerWidth, window.innerHeight), 320), 800);
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
                var selectedElement = self.collection.at(index);
                var partial_exclusive = _.reduce(self.arc_widths.slice(0, index), Math.sum, 0);
                var partial_inclusive = partial_exclusive + self.arc_widths[index];
                var angle_selected = partial_exclusive + (partial_inclusive - partial_exclusive) / 2;
                var full_rotations = 10;
                var rotation_max = Math.TWO_PI * full_rotations + (Math.TWO_PI - angle_selected);

                function easeOutCirc(t, b, c, d) {
                    return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
                }

                if (self.audioEnabled && self.spinAudio) {
                    self.spinAudio.currentTime = 0;
                    self.spinAudio.play();
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
                    var selected_label = selectedElement.get("label");
var selected_color = self.colors[index]; // slice color
var selected_link = selectedElement.get("link");
var selected_types = selectedElement.get("types");
self.showResultPopup(selected_label, selected_color, selected_link, selected_types);
                    after();
                }, self.animation_duration);
            },

            toggleAudio: function() {
                this.audioEnabled = !this.audioEnabled;
            },

            showResultPopup: function(label, color, link, types) {
            var popup = $("#wheel-popup");
            popup.empty();

            if (types && types.length > 0) {
                var typeText = types.length === 1 ? types[0] : types.join(", ");
                var typesDiv = $("<div>").text(typeText).css({ "margin-bottom": "10px", "font-size":"15px" });
                popup.append(typesDiv);
            }

            var labelDiv = $("<div>").text(label).css({ "margin-bottom": "10px", "font-weight":"bold" });
            popup.append(labelDiv);

            if (link) {
                var linkEl = $("<a>")
                    .attr("href", link)
                    .attr("target","_blank")
                    .text("Link do materiału")
                    .css({ "color":"#00f","text-decoration":"underline","cursor":"pointer" });
                popup.append(linkEl);
            }

            var hex = color.replace(/^#/,"");
            var r=parseInt(hex.substr(0,2),16), g=parseInt(hex.substr(2,2),16), b=parseInt(hex.substr(4,2),16);
            var brightness=(r*299+g*587+b*114)/1000;
            var textColor = brightness>128 ? "#000" : "#fff";

            popup.css({ 
                background:"#"+color,
                color:textColor,
                display:"block",
                transform:"translate(-50%,-50%) scale(0.5)",
                opacity:0
            });

            setTimeout(()=>{ popup.css({ transform:"translate(-50%,-50%) scale(1)", opacity:1 }); },10);

            function showCopiedTooltip() {
    const tooltip = $("<div>")
        .text("Skopiowano link")
        .css({
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%) translateY(20px)",
            background: "#333",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "4px",
            fontSize: "14px",
            opacity: 0,
            pointerEvents: "none",
            zIndex: 9999,
            transition: "opacity 0.3s ease, transform 0.3s ease"
        });

    $("body").append(tooltip);

    // Animate tooltip in
    setTimeout(() => {
        tooltip.css({ opacity: 1, transform: "translateX(-50%) translateY(0)" });
    }, 10);

    // Fade out after 1 second
    setTimeout(() => {
        tooltip.css({ opacity: 0, transform: "translateX(-50%) translateY(-20px)" });
        setTimeout(() => tooltip.remove(), 300); // remove after transition
    }, 1000);
}
        var checkbox = document.getElementById('copyCheckbox');

            popup.off("click");
            popup.on("click", function(){
                if (checkbox.checked) {
                navigator.clipboard.writeText(link).then(() => {
            showCopiedTooltip();
        }).catch(err => console.error("Copy failed", err));
    }
                popup.css({ transform:"translate(-50%,-50%) scale(0.5)", opacity:0 });
                setTimeout(()=>popup.css({ display:"none" }), 300);
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

                var checkboxes = document.getElementsByClassName('wheel-type-checkbox');

                for (let i = 0; i < checkboxes.length; i++) {
                    checkboxes[i].disabled = true;
                }


                this.render_spin(function() {
                    el.addClass("clickable");
                    for (let i = 0; i < checkboxes.length; i++) {
                        checkboxes[i].disabled = false;
                    }
                });
            }
        });

        return Wheel;
    });