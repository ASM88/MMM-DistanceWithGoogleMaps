Module.register("MMM-DistanceWithGoogleMaps", {
    // Default module config.
    defaults: {
        apiKey: "",
        updateInterval: "15",
        origin: "Theaterplatz 2, 01067 Dresden",
        destinations: [
            {
                label: "Semperoper",
                search: "Norderelbstraße 8, 20457 Hamburg"
            },
            {
                label: "Frauenkirche",
                search: "Neumarkt, 01067 Dresden"
            },
            {
                label: "Marienplatz",
                search: "Marienplatz, 80331 München"
            }
        ]
    },

    getStyles: function () {
        return ["font-awesome.css", "MMM-DistanceWithGoogleMaps.css"];
    },

    start: function () {
        var self = this;
        Log.info("Starting module: " + this.name);

        if (this.config.apiKey === "") {
            Log.error("MMM-DistanceWithGoogleMaps: API key not provided or valid!");
            return;
        }

        setInterval(function () {
            self.updateDom();
        }, this.config.updateInterval * 60 * 1000);
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.classList.add("traffic-wrapper");

        function updateUI(ds) {
            for (d of ds) {
                wrapper.innerHTML += "<div class='traffic-row'><span class='traffic-label'>" + d.label + "</span><span class='traffic-duration'>" + d.duration + "</span></div>";
            }
        }

        function search(origin, destinations) {
            const destinationsForApi = destinations.map(t => t.search);

            const service = new google.maps.DistanceMatrixService;

            service.getDistanceMatrix({
                origins: [origin],
                destinations: destinationsForApi,
                travelMode: 'DRIVING',
                drivingOptions: {
                    departureTime: new Date(Date.now() + 60 * 1000)
                },
                unitSystem: google.maps.UnitSystem.METRIC
            }, function (response, status) {
                if (status !== 'OK') {
                    Log.error('Error was: ' + status);
                } else {
                    Log.debug(response);
                    const results = response.rows[0].elements;
                    const destinationsWithDuration = destinations;
                    for (let i = 0; i < destinationsWithDuration.length; i++) {
                        destinationsWithDuration[i]["duration"] = results[i].duration_in_traffic.text;
                    }
                    updateUI(destinationsWithDuration);
                }
            })
        }

        function addMapsApi(key) {
            const mapsUrl = "https://maps.googleapis.com/maps/api/js?language=de-DE&key=" + key;
            for (s of document.scripts) {
                if (s.src === mapsUrl) return;
            }
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = mapsUrl;
            document.body.appendChild(script);
        }

        function waitForMapsApi(origin, destinations) {
            setTimeout(function () {
                try {
                    if (google && google.maps && google.maps.DistanceMatrixService) {
                        search(origin, destinations);
                        return;
                    }
                } catch (e) {
                    Log.warn("Exception while calling Distance Matrix API: ", e);
                }
                waitForMapsApi(origin, destinations);
            }, 1000);
        }

        function executeUpdate(origin, destinations, key) {
            addMapsApi(key);
            waitForMapsApi(origin, destinations);
        }

        executeUpdate(this.config.origin, this.config.destinations, this.config.apiKey);
        return wrapper;
    }
});