/*
 * convenience functions for loading shaders, and loading meshes in a simple JSON format.
 *
 * loadFile/loadFiles from http://stackoverflow.com/questions/4878145/javascript-and-webgl-external-scripts
 * loadMesh adapted from various loaders in http://threejs.org
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    function loadFile(url, data, callback, errorCallback) {
        // Set up an asynchronous request
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        // Hook the event that gets called as the request progresses
        request.onreadystatechange = function () {
            // If the request is "DONE" (completed or failed)
            if (request.readyState == 4) {
                // If we got HTTP status 200 (OK)
                if (request.status == 200) {
                    callback(request.responseText, data);
                }
                else {
                    errorCallback(url);
                }
            }
        };
        request.send(null);
    }
    function loadFiles(urls, callback, errorCallback) {
        var numUrls = urls.length;
        var numComplete = 0;
        var result = [];
        // Callback for a single file
        function partialCallback(text, urlIndex) {
            result[urlIndex] = text;
            numComplete++;
            // When all files have downloaded
            if (numComplete == numUrls) {
                callback(result);
            }
        }
        for (var i = 0; i < numUrls; i++) {
            loadFile(urls[i], i, partialCallback, errorCallback);
        }
    }
    exports.loadFiles = loadFiles;
    // if there is a current request outstanding, this will be set to it
    var currentRequest = undefined;
    function loadMesh(url, onLoad, onProgress, onError) {
        // if there is a request in progress, abort it.
        if (currentRequest !== undefined) {
            request.abort();
            currentRequest = undefined;
        }
        // set up the new request	
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        currentRequest = request; // save it, so we can abort if another request is made by the user
        request.addEventListener('load', function (event) {
            // finished with the current request now
            currentRequest = undefined;
            //var json = this.response;  /// already in JSON format, don't need: 
            var json = JSON.parse(this.response);
            // we'll put a metadata field in the object, just to be sure it's one of ours
            var metadata = json.metadata;
            if (metadata !== undefined) {
                if (metadata.type !== 'triangles') {
                    console.error('Loader: ' + url + ' should be a "triangles" files.');
                    return;
                }
            }
            else {
                console.error('Loader: ' + url + ' does not have a metadata field.');
                return;
            }
            var object = validate(json, url);
            if (object !== undefined) {
                console.log("Loader: " + url + " contains " + object.v.length + " vertices " +
                    " and " + object.t.length + " triangles.");
            }
            onLoad(object);
        }, false);
        if (onProgress !== undefined) {
            request.addEventListener('progress', function (event) {
                onProgress(event);
            }, false);
        }
        if (onError !== undefined) {
            request.addEventListener('error', function (event) {
                currentRequest = undefined; // request failed, clear the current request field
                if (onError)
                    onError(event);
            }, false);
        }
        // ask for a "json" file
        //request.responseType = "json";
        request.send(null);
        return request;
    }
    exports.loadMesh = loadMesh;
    // validate the received JSON, just to make sure it's what we are expecting (and thus avoid
    // bugs down the road in our code)
    function validate(json, url) {
        if (json instanceof Object &&
            json.hasOwnProperty('t') &&
            json.t instanceof Array &&
            json.hasOwnProperty('v') &&
            json.v instanceof Array) {
            var numV = json.v.length;
            for (var i in json.t) {
                if (!(json.t[i] instanceof Array &&
                    json.t[i].length == 3 &&
                    typeof json.t[i][0] == "number" &&
                    typeof json.t[i][1] == "number" &&
                    typeof json.t[i][2] == "number" &&
                    json.t[i][0] < numV &&
                    json.t[i][1] < numV &&
                    json.t[i][2] < numV)) {
                    console.log("Loader: json file " + url + ", invalid t[" + i + "].");
                    return undefined;
                }
            }
            for (var i in json.v) {
                if (!(json.v[i] instanceof Array &&
                    json.v[i].length == 3 &&
                    typeof json.v[i][0] == "number" &&
                    typeof json.v[i][1] == "number" &&
                    typeof json.v[i][2] == "number")) {
                    console.log("Loader: json file " + url + ", invalid v[" + i + "].");
                    return undefined;
                }
                i++;
            }
            return json;
        }
        else {
            console.log("Loader: json file " + url + " does not have .t and .v members.");
            return undefined;
        }
    }
});

//# sourceMappingURL=data:application/json;base64,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QUFHLElBQUksQ0FBQyxDQUFDO29CQUNwRSxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUNELENBQUMsRUFBRSxDQUFDO1lBQ0wsQ0FBQztZQUNELE1BQU0sQ0FBTyxJQUFJLENBQUM7UUFDbkIsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsR0FBRyxHQUFHLEdBQUcsbUNBQW1DLENBQUMsQ0FBQztZQUM5RSxNQUFNLENBQUMsU0FBUyxDQUFDO1FBQ2xCLENBQUM7SUFDRixDQUFDIiwiZmlsZSI6ImxvYWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG4vKlxyXG4gKiBjb252ZW5pZW5jZSBmdW5jdGlvbnMgZm9yIGxvYWRpbmcgc2hhZGVycywgYW5kIGxvYWRpbmcgbWVzaGVzIGluIGEgc2ltcGxlIEpTT04gZm9ybWF0LlxyXG4gKiBcclxuICogbG9hZEZpbGUvbG9hZEZpbGVzIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy80ODc4MTQ1L2phdmFzY3JpcHQtYW5kLXdlYmdsLWV4dGVybmFsLXNjcmlwdHNcclxuICogbG9hZE1lc2ggYWRhcHRlZCBmcm9tIHZhcmlvdXMgbG9hZGVycyBpbiBodHRwOi8vdGhyZWVqcy5vcmdcclxuICovXHJcblxyXG5cclxuZnVuY3Rpb24gbG9hZEZpbGUodXJsLCBkYXRhLCBjYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xyXG5cdC8vIFNldCB1cCBhbiBhc3luY2hyb25vdXMgcmVxdWVzdFxyXG5cdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0cmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xyXG5cclxuXHQvLyBIb29rIHRoZSBldmVudCB0aGF0IGdldHMgY2FsbGVkIGFzIHRoZSByZXF1ZXN0IHByb2dyZXNzZXNcclxuXHRyZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdC8vIElmIHRoZSByZXF1ZXN0IGlzIFwiRE9ORVwiIChjb21wbGV0ZWQgb3IgZmFpbGVkKVxyXG5cdFx0aWYgKHJlcXVlc3QucmVhZHlTdGF0ZSA9PSA0KSB7XHJcblx0XHRcdC8vIElmIHdlIGdvdCBIVFRQIHN0YXR1cyAyMDAgKE9LKVxyXG5cdFx0XHRpZiAocmVxdWVzdC5zdGF0dXMgPT0gMjAwKSB7XHJcblx0XHRcdFx0Y2FsbGJhY2socmVxdWVzdC5yZXNwb25zZVRleHQsIGRhdGEpXHJcblx0XHRcdH0gZWxzZSB7IC8vIEZhaWxlZFxyXG5cdFx0XHRcdGVycm9yQ2FsbGJhY2sodXJsKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdHJlcXVlc3Quc2VuZChudWxsKTsgICAgXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkRmlsZXModXJscywgY2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spIHtcclxuXHR2YXIgbnVtVXJscyA9IHVybHMubGVuZ3RoO1xyXG5cdHZhciBudW1Db21wbGV0ZSA9IDA7XHJcblx0dmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuXHQvLyBDYWxsYmFjayBmb3IgYSBzaW5nbGUgZmlsZVxyXG5cdGZ1bmN0aW9uIHBhcnRpYWxDYWxsYmFjayh0ZXh0LCB1cmxJbmRleCkge1xyXG5cdFx0cmVzdWx0W3VybEluZGV4XSA9IHRleHQ7XHJcblx0XHRudW1Db21wbGV0ZSsrO1xyXG5cclxuXHRcdC8vIFdoZW4gYWxsIGZpbGVzIGhhdmUgZG93bmxvYWRlZFxyXG5cdFx0aWYgKG51bUNvbXBsZXRlID09IG51bVVybHMpIHtcclxuXHRcdFx0Y2FsbGJhY2socmVzdWx0KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbnVtVXJsczsgaSsrKSB7XHJcblx0XHRsb2FkRmlsZSh1cmxzW2ldLCBpLCBwYXJ0aWFsQ2FsbGJhY2ssIGVycm9yQ2FsbGJhY2spO1xyXG5cdH1cclxufVxyXG5cclxuXHJcblxyXG4vKlxyXG4gKiBMb2FkIGEgTWVzaCBmaWxlIGFzeW5jaHJvbm91c2x5IGZyb20gYSBmaWxlIHN0b3JlZCBvbiB0aGUgd2ViLlxyXG4gKiBUaGUgcmVzdWx0cyB3aWxsIGJlIHByb3ZpZGVkIHRvIHRoZSBcIm9uTG9hZFwiIGNhbGxiYWNrLCBhbmQgYXJlIGEgTWVzaCBvYmplY3RcclxuICogd2l0aCBhbiBhcnJheSBvZiB2ZXJ0aWNlcyBhbmQgYW4gYXJyYXkgb2YgdHJpYW5nbGVzIGFzIG1lbWJlcnMuXHJcbiAqIFxyXG4gKiBGb3IgZXhhbXBsZTogIFxyXG4gKiB2YXIgb25Mb2FkID0gZnVuY3Rpb24gKG1lc2g6IGxvYWRlci5NZXNoKSB7XHJcbiAqICBcdGNvbnNvbGUubG9nKFwiZ290IGEgbWVzaDogXCIgKyBtZXNoKTtcclxuICogfVxyXG4gKiB2YXIgb25Qcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzczogUHJvZ3Jlc3NFdmVudCkge1xyXG4gKiAgXHRjb25zb2xlLmxvZyhcImxvYWRpbmc6IFwiICsgcHJvZ3Jlc3MubG9hZGVkICsgXCIgb2YgXCIgKyBwcm9ncmVzcy50b3RhbCArIFwiLi4uXCIpO1xyXG4gKiB9XHJcbiAqIHZhciBvbkVycm9yID0gZnVuY3Rpb24gKGVycm9yOiBFcnJvckV2ZW50KSB7XHJcbiAqICBcdGNvbnNvbGUubG9nKFwiZXJyb3IhIFwiICsgZXJyb3IpO1xyXG4gKiB9XHJcbiAqIFxyXG4gKiBsb2FkZXIubG9hZE1lc2goXCJtb2RlbHMvdmVudXMuanNvblwiLCBvbkxvYWQsIG9uUHJvZ3Jlc3MsIG9uRXJyb3IpO1xyXG4gKiBcclxuICovXHJcblxyXG5leHBvcnQgdHlwZSBWZXJ0ZXggPSBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XHJcbmV4cG9ydCB0eXBlIFRyaWFuZ2xlID0gW251bWJlciwgbnVtYmVyLCBudW1iZXJdO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNZXNoIHtcclxuXHR2OiBBcnJheTxWZXJ0ZXg+O1xyXG5cdHQ6IEFycmF5PFRyaWFuZ2xlPjtcclxufVxyXG5cclxuLy8gaWYgdGhlcmUgaXMgYSBjdXJyZW50IHJlcXVlc3Qgb3V0c3RhbmRpbmcsIHRoaXMgd2lsbCBiZSBzZXQgdG8gaXRcclxudmFyIGN1cnJlbnRSZXF1ZXN0ID0gdW5kZWZpbmVkO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRNZXNoICggdXJsOiBzdHJpbmcsIFxyXG5cdFx0XHRcdFx0b25Mb2FkOiAoZGF0YTogYW55KSA9PiB2b2lkLCBcclxuXHRcdFx0XHRcdG9uUHJvZ3Jlc3M/OiAocHJvZ3Jlc3M6IFByb2dyZXNzRXZlbnQpID0+IHZvaWQsIFxyXG5cdFx0XHRcdFx0b25FcnJvcj86IChlcnJvcjogRXJyb3JFdmVudCkgPT4gdm9pZCApOiBYTUxIdHRwUmVxdWVzdCB7XHJcblxyXG4gICAgLy8gaWYgdGhlcmUgaXMgYSByZXF1ZXN0IGluIHByb2dyZXNzLCBhYm9ydCBpdC5cclxuICAgIGlmIChjdXJyZW50UmVxdWVzdCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRyZXF1ZXN0LmFib3J0KCk7XHJcblx0XHRjdXJyZW50UmVxdWVzdCA9IHVuZGVmaW5lZDtcclxuXHR9XHJcblxyXG5cdC8vIHNldCB1cCB0aGUgbmV3IHJlcXVlc3RcdFxyXG5cdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0cmVxdWVzdC5vcGVuKCAnR0VUJywgdXJsLCB0cnVlICk7XHJcblx0Y3VycmVudFJlcXVlc3QgPSByZXF1ZXN0OyAgLy8gc2F2ZSBpdCwgc28gd2UgY2FuIGFib3J0IGlmIGFub3RoZXIgcmVxdWVzdCBpcyBtYWRlIGJ5IHRoZSB1c2VyXHJcblx0XHJcblx0cmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcblx0XHQvLyBmaW5pc2hlZCB3aXRoIHRoZSBjdXJyZW50IHJlcXVlc3Qgbm93XHJcblx0XHRjdXJyZW50UmVxdWVzdCA9IHVuZGVmaW5lZDtcclxuXHRcdFxyXG5cdFx0Ly92YXIganNvbiA9IHRoaXMucmVzcG9uc2U7ICAvLy8gYWxyZWFkeSBpbiBKU09OIGZvcm1hdCwgZG9uJ3QgbmVlZDogXHJcblx0XHR2YXIganNvbiA9IEpTT04ucGFyc2UoIHRoaXMucmVzcG9uc2UgKTtcclxuXHJcblx0XHQvLyB3ZSdsbCBwdXQgYSBtZXRhZGF0YSBmaWVsZCBpbiB0aGUgb2JqZWN0LCBqdXN0IHRvIGJlIHN1cmUgaXQncyBvbmUgb2Ygb3Vyc1xyXG5cdFx0dmFyIG1ldGFkYXRhID0ganNvbi5tZXRhZGF0YTtcclxuXHRcdGlmICggbWV0YWRhdGEgIT09IHVuZGVmaW5lZCApIHtcclxuXHRcdFx0aWYgKCBtZXRhZGF0YS50eXBlICE9PSAndHJpYW5nbGVzJyApIHtcclxuXHRcdFx0XHRjb25zb2xlLmVycm9yKCAnTG9hZGVyOiAnICsgdXJsICsgJyBzaG91bGQgYmUgYSBcInRyaWFuZ2xlc1wiIGZpbGVzLicgKTtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoICdMb2FkZXI6ICcgKyB1cmwgKyAnIGRvZXMgbm90IGhhdmUgYSBtZXRhZGF0YSBmaWVsZC4nICk7XHJcblx0XHRcdHJldHVybjtcdFx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBvYmplY3QgPSB2YWxpZGF0ZSgganNvbiwgdXJsICk7XHJcblx0XHRcclxuXHRcdGlmIChvYmplY3QgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZyhcIkxvYWRlcjogXCIgKyB1cmwgKyBcIiBjb250YWlucyBcIiArIG9iamVjdC52Lmxlbmd0aCArIFwiIHZlcnRpY2VzIFwiICtcclxuXHRcdFx0XHRcIiBhbmQgXCIgKyBvYmplY3QudC5sZW5ndGggKyBcIiB0cmlhbmdsZXMuXCIpXHJcblx0XHR9XHJcblx0XHRvbkxvYWQoIG9iamVjdCApO1xyXG5cdH0sIGZhbHNlICk7XHJcblxyXG5cdGlmICggb25Qcm9ncmVzcyAhPT0gdW5kZWZpbmVkICkge1xyXG5cdFx0cmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCAncHJvZ3Jlc3MnLCBmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG5cdFx0XHRvblByb2dyZXNzKCBldmVudCApO1xyXG5cdFx0fSwgZmFsc2UgKTtcclxuXHR9XHJcblxyXG5cdGlmICggb25FcnJvciAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRyZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoICdlcnJvcicsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcblx0XHRcdGN1cnJlbnRSZXF1ZXN0ID0gdW5kZWZpbmVkOyAvLyByZXF1ZXN0IGZhaWxlZCwgY2xlYXIgdGhlIGN1cnJlbnQgcmVxdWVzdCBmaWVsZFxyXG5cdFx0XHRpZiAoIG9uRXJyb3IgKSBvbkVycm9yKCBldmVudCApO1xyXG5cdFx0fSwgZmFsc2UgKTtcclxuXHR9XHJcblxyXG5cdC8vIGFzayBmb3IgYSBcImpzb25cIiBmaWxlXHJcblx0Ly9yZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IFwianNvblwiO1xyXG5cdHJlcXVlc3Quc2VuZCggbnVsbCApO1xyXG5cclxuXHRyZXR1cm4gcmVxdWVzdDtcclxufVxyXG5cclxuLy8gdmFsaWRhdGUgdGhlIHJlY2VpdmVkIEpTT04sIGp1c3QgdG8gbWFrZSBzdXJlIGl0J3Mgd2hhdCB3ZSBhcmUgZXhwZWN0aW5nIChhbmQgdGh1cyBhdm9pZFxyXG4vLyBidWdzIGRvd24gdGhlIHJvYWQgaW4gb3VyIGNvZGUpXHJcbmZ1bmN0aW9uIHZhbGlkYXRlKGpzb246IGFueSwgdXJsOiBzdHJpbmcpOiBNZXNoIHtcclxuXHRpZiAoanNvbiBpbnN0YW5jZW9mIE9iamVjdCAmJiBcclxuXHRcdFx0anNvbi5oYXNPd25Qcm9wZXJ0eSgndCcpICYmXHJcblx0XHRcdGpzb24udCBpbnN0YW5jZW9mIEFycmF5ICYmIFx0XHJcblx0XHRcdGpzb24uaGFzT3duUHJvcGVydHkoJ3YnKSAmJlxyXG5cdFx0XHRqc29uLnYgaW5zdGFuY2VvZiBBcnJheSkge1xyXG5cclxuXHQgICAgdmFyIG51bVYgPSBqc29uLnYubGVuZ3RoO1xyXG5cdFx0Zm9yICh2YXIgaSBpbiBqc29uLnQpIHtcclxuXHRcdFx0aWYgKCEoanNvbi50W2ldIGluc3RhbmNlb2YgQXJyYXkgJiZcclxuXHRcdFx0XHRqc29uLnRbaV0ubGVuZ3RoID09IDMgJiZcclxuXHRcdFx0XHR0eXBlb2YganNvbi50W2ldWzBdID09IFwibnVtYmVyXCIgJiZcclxuXHRcdFx0XHR0eXBlb2YganNvbi50W2ldWzFdID09IFwibnVtYmVyXCIgJiZcclxuXHRcdFx0XHR0eXBlb2YganNvbi50W2ldWzJdID09IFwibnVtYmVyXCIgJiYgXHJcblx0XHRcdFx0anNvbi50W2ldWzBdIDwgbnVtViAmJlxyXG5cdFx0XHRcdGpzb24udFtpXVsxXSA8IG51bVYgJiZcclxuXHRcdFx0XHRqc29uLnRbaV1bMl0gPCBudW1WKSkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiTG9hZGVyOiBqc29uIGZpbGUgXCIgKyB1cmwgKyBcIiwgaW52YWxpZCB0W1wiICsgaSArIFwiXS5cIik7XHJcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcdFx0XHRcdFx0XHQgIFxyXG5cdFx0XHR9XHJcblx0XHR9IFxyXG5cdFx0Zm9yICh2YXIgaSBpbiBqc29uLnYpIHtcclxuXHRcdFx0aWYgKCEoanNvbi52W2ldIGluc3RhbmNlb2YgQXJyYXkgJiZcclxuXHRcdFx0XHRqc29uLnZbaV0ubGVuZ3RoID09IDMgJiZcclxuXHRcdFx0XHR0eXBlb2YganNvbi52W2ldWzBdID09IFwibnVtYmVyXCIgJiZcclxuXHRcdFx0XHR0eXBlb2YganNvbi52W2ldWzFdID09IFwibnVtYmVyXCIgJiZcclxuXHRcdFx0XHR0eXBlb2YganNvbi52W2ldWzJdID09IFwibnVtYmVyXCIpKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coXCJMb2FkZXI6IGpzb24gZmlsZSBcIiArIHVybCArIFwiLCBpbnZhbGlkIHZbXCIgKyBpICsgXCJdLlwiKTtcclxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1x0XHRcdFx0XHRcdCAgXHJcblx0XHRcdH1cclxuXHRcdFx0aSsrO1xyXG5cdFx0fSBcclxuXHRcdHJldHVybiA8TWVzaD5qc29uOyAgXHJcblx0fSBlbHNlIHtcclxuXHRcdGNvbnNvbGUubG9nKFwiTG9hZGVyOiBqc29uIGZpbGUgXCIgKyB1cmwgKyBcIiBkb2VzIG5vdCBoYXZlIC50IGFuZCAudiBtZW1iZXJzLlwiKTtcclxuXHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0fVxyXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
