/*
 * convenience functions for loading shaders, and loading meshes in a simple JSON format.
 *
 * loadFile/loadFiles from http://stackoverflow.com/questions/4878145/javascript-and-webgl-external-scripts
 * loadMesh adapted from various loaders in http://threejs.org
 */
define(["require", "exports"], function (require, exports) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxvYWRlci50cyJdLCJuYW1lcyI6WyJsb2FkRmlsZSIsImxvYWRGaWxlcyIsImxvYWRGaWxlcy5wYXJ0aWFsQ2FsbGJhY2siLCJsb2FkTWVzaCIsInZhbGlkYXRlIl0sIm1hcHBpbmdzIjoiQUFDQTs7Ozs7R0FLRzs7SUFHSCxrQkFBa0IsR0FBRyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsYUFBYTtRQUNuREEsaUNBQWlDQTtRQUNqQ0EsSUFBSUEsT0FBT0EsR0FBR0EsSUFBSUEsY0FBY0EsRUFBRUEsQ0FBQ0E7UUFDbkNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLEdBQUdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRS9CQSw0REFBNERBO1FBQzVEQSxPQUFPQSxDQUFDQSxrQkFBa0JBLEdBQUdBO1lBQzVCLGlEQUFpRDtZQUNqRCxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLGlDQUFpQztnQkFDakMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUMzQixRQUFRLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQTtnQkFDckMsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDUCxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQyxDQUFDQTtRQUVGQSxPQUFPQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtJQUNwQkEsQ0FBQ0E7SUFFRCxtQkFBMEIsSUFBSSxFQUFFLFFBQVEsRUFBRSxhQUFhO1FBQ3REQyxJQUFJQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUMxQkEsSUFBSUEsV0FBV0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDcEJBLElBQUlBLE1BQU1BLEdBQUdBLEVBQUVBLENB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QSxDQUFDQSxDQUFDQSxDQUFDQTtZQUV4QkEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDNUJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUN0QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsS0FBS0E7b0JBQy9CQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxJQUFJQSxDQUFDQTtvQkFDckJBLE9BQU9BLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLFFBQVFBO29CQUMvQkEsT0FBT0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsUUFBUUE7b0JBQy9CQSxPQUFPQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxRQUFRQTtvQkFDL0JBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBO29CQUNuQkEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUE7b0JBQ25CQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDdkJBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLG9CQUFvQkEsR0FBR0EsR0FBR0EsR0FBR0EsY0FBY0EsR0FBR0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ3BFQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQTtnQkFDbEJBLENBQUNBO1lBQ0ZBLENBQUNBO1lBQ0RBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUN0QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsS0FBS0E7b0JBQy9CQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxJQUFJQSxDQUFDQTtvQkFDckJBLE9BQU9BLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLFFBQVFBO29CQUMvQkEsT0FBT0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsUUFBUUE7b0JBQy9CQSxPQUFPQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbkNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLG9CQUFvQkEsR0FBR0EsR0FBR0EsR0FBR0EsY0FBY0EsR0FBR0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ3BFQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQTtnQkFDbEJBLENBQUNBO2dCQUNEQSxDQUFDQSxFQUFFQSxDQUFDQTtZQUNMQSxDQUFDQTtZQUNEQSxNQUFNQSxDQUFPQSxJQUFJQSxDQUFDQTtRQUNuQkEsQ0FBQ0E7UUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDUEEsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0Esb0JBQW9CQSxHQUFHQSxHQUFHQSxHQUFHQSxtQ0FBbUNBLENBQUNBLENBQUNBO1lBQzlFQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQTtRQUNsQkEsQ0FBQ0E7SUFDRkEsQ0FBQ0EiLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbi8qXHJcbiAqIGNvbnZlbmllbmNlIGZ1bmN0aW9ucyBmb3IgbG9hZGluZyBzaGFkZXJzLCBhbmQgbG9hZGluZyBtZXNoZXMgaW4gYSBzaW1wbGUgSlNPTiBmb3JtYXQuXHJcbiAqIFxyXG4gKiBsb2FkRmlsZS9sb2FkRmlsZXMgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzQ4NzgxNDUvamF2YXNjcmlwdC1hbmQtd2ViZ2wtZXh0ZXJuYWwtc2NyaXB0c1xyXG4gKiBsb2FkTWVzaCBhZGFwdGVkIGZyb20gdmFyaW91cyBsb2FkZXJzIGluIGh0dHA6Ly90aHJlZWpzLm9yZ1xyXG4gKi9cclxuXHJcblxyXG5mdW5jdGlvbiBsb2FkRmlsZSh1cmwsIGRhdGEsIGNhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSB7XHJcblx0Ly8gU2V0IHVwIGFuIGFzeW5jaHJvbm91cyByZXF1ZXN0XHJcblx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRyZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XHJcblxyXG5cdC8vIEhvb2sgdGhlIGV2ZW50IHRoYXQgZ2V0cyBjYWxsZWQgYXMgdGhlIHJlcXVlc3QgcHJvZ3Jlc3Nlc1xyXG5cdHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0Ly8gSWYgdGhlIHJlcXVlc3QgaXMgXCJET05FXCIgKGNvbXBsZXRlZCBvciBmYWlsZWQpXHJcblx0XHRpZiAocmVxdWVzdC5yZWFkeVN0YXRlID09IDQpIHtcclxuXHRcdFx0Ly8gSWYgd2UgZ290IEhUVFAgc3RhdHVzIDIwMCAoT0spXHJcblx0XHRcdGlmIChyZXF1ZXN0LnN0YXR1cyA9PSAyMDApIHtcclxuXHRcdFx0XHRjYWxsYmFjayhyZXF1ZXN0LnJlc3BvbnNlVGV4dCwgZGF0YSlcclxuXHRcdFx0fSBlbHNlIHsgLy8gRmFpbGVkXHJcblx0XHRcdFx0ZXJyb3JDYWxsYmFjayh1cmwpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0cmVxdWVzdC5zZW5kKG51bGwpOyAgICBcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRGaWxlcyh1cmxzLCBjYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xyXG5cdHZhciBudW1VcmxzID0gdXJscy5sZW5ndGg7XHJcblx0dmFyIG51bUNvbXBsZXRlID0gMDtcclxuXHR2YXIgcmVzdWx0ID0gW107XHJcblxyXG5cdC8vIENhbGxiYWNrIGZvciBhIHNpbmdsZSBmaWxlXHJcblx0ZnVuY3Rpb24gcGFydGlhbENhbGxiYWNrKHRleHQsIHVybEluZGV4KSB7XHJcblx0XHRyZXN1bHRbdXJsSW5kZXhdID0gdGV4dDtcclxuXHRcdG51bUNvbXBsZXRlKys7XHJcblxyXG5cdFx0Ly8gV2hlbiBhbGwgZmlsZXMgaGF2ZSBkb3dubG9hZGVkXHJcblx0XHRpZiAobnVtQ29tcGxldGUgPT0gbnVtVXJscykge1xyXG5cdFx0XHRjYWxsYmFjayhyZXN1bHQpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBudW1VcmxzOyBpKyspIHtcclxuXHRcdGxvYWRGaWxlKHVybHNbaV0sIGksIHBhcnRpYWxDYWxsYmFjaywgZXJyb3JDYWxsYmFjayk7XHJcblx0fVxyXG59XHJcblxyXG5cclxuXHJcbi8qXHJcbiAqIExvYWQgYSBNZXNoIGZpbGUgYXN5bmNocm9ub3VzbHkgZnJvbSBhIGZpbGUgc3RvcmVkIG9uIHRoZSB3ZWIuXHJcbiAqIFRoZSByZXN1bHRzIHdpbGwgYmUgcHJvdmlkZWQgdG8gdGhlIFwib25Mb2FkXCIgY2FsbGJhY2ssIGFuZCBhcmUgYSBNZXNoIG9iamVjdFxyXG4gKiB3aXRoIGFuIGFycmF5IG9mIHZlcnRpY2VzIGFuZCBhbiBhcnJheSBvZiB0cmlhbmdsZXMgYXMgbWVtYmVycy5cclxuICogXHJcbiAqIEZvciBleGFtcGxlOiAgXHJcbiAqIHZhciBvbkxvYWQgPSBmdW5jdGlvbiAobWVzaDogbG9hZGVyLk1lc2gpIHtcclxuICogIFx0Y29uc29sZS5sb2coXCJnb3QgYSBtZXNoOiBcIiArIG1lc2gpO1xyXG4gKiB9XHJcbiAqIHZhciBvblByb2dyZXNzID0gZnVuY3Rpb24gKHByb2dyZXNzOiBQcm9ncmVzc0V2ZW50KSB7XHJcbiAqICBcdGNvbnNvbGUubG9nKFwibG9hZGluZzogXCIgKyBwcm9ncmVzcy5sb2FkZWQgKyBcIiBvZiBcIiArIHByb2dyZXNzLnRvdGFsICsgXCIuLi5cIik7XHJcbiAqIH1cclxuICogdmFyIG9uRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3I6IEVycm9yRXZlbnQpIHtcclxuICogIFx0Y29uc29sZS5sb2coXCJlcnJvciEgXCIgKyBlcnJvcik7XHJcbiAqIH1cclxuICogXHJcbiAqIGxvYWRlci5sb2FkTWVzaChcIm1vZGVscy92ZW51cy5qc29uXCIsIG9uTG9hZCwgb25Qcm9ncmVzcywgb25FcnJvcik7XHJcbiAqIFxyXG4gKi9cclxuXHJcbmV4cG9ydCB0eXBlIFZlcnRleCA9IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXTtcclxuZXhwb3J0IHR5cGUgVHJpYW5nbGUgPSBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE1lc2gge1xyXG5cdHY6IEFycmF5PFZlcnRleD47XHJcblx0dDogQXJyYXk8VHJpYW5nbGU+O1xyXG59XHJcblxyXG4vLyBpZiB0aGVyZSBpcyBhIGN1cnJlbnQgcmVxdWVzdCBvdXRzdGFuZGluZywgdGhpcyB3aWxsIGJlIHNldCB0byBpdFxyXG52YXIgY3VycmVudFJlcXVlc3QgPSB1bmRlZmluZWQ7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbG9hZE1lc2ggKCB1cmw6IHN0cmluZywgXHJcblx0XHRcdFx0XHRvbkxvYWQ6IChkYXRhOiBhbnkpID0+IHZvaWQsIFxyXG5cdFx0XHRcdFx0b25Qcm9ncmVzcz86IChwcm9ncmVzczogUHJvZ3Jlc3NFdmVudCkgPT4gdm9pZCwgXHJcblx0XHRcdFx0XHRvbkVycm9yPzogKGVycm9yOiBFcnJvckV2ZW50KSA9PiB2b2lkICk6IFhNTEh0dHBSZXF1ZXN0IHtcclxuXHJcbiAgICAvLyBpZiB0aGVyZSBpcyBhIHJlcXVlc3QgaW4gcHJvZ3Jlc3MsIGFib3J0IGl0LlxyXG4gICAgaWYgKGN1cnJlbnRSZXF1ZXN0ICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdHJlcXVlc3QuYWJvcnQoKTtcclxuXHRcdGN1cnJlbnRSZXF1ZXN0ID0gdW5kZWZpbmVkO1xyXG5cdH1cclxuXHJcblx0Ly8gc2V0IHVwIHRoZSBuZXcgcmVxdWVzdFx0XHJcblx0dmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRyZXF1ZXN0Lm9wZW4oICdHRVQnLCB1cmwsIHRydWUgKTtcclxuXHRjdXJyZW50UmVxdWVzdCA9IHJlcXVlc3Q7ICAvLyBzYXZlIGl0LCBzbyB3ZSBjYW4gYWJvcnQgaWYgYW5vdGhlciByZXF1ZXN0IGlzIG1hZGUgYnkgdGhlIHVzZXJcclxuXHRcclxuXHRyZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoICdsb2FkJywgZnVuY3Rpb24gKCBldmVudCApIHtcclxuXHRcdC8vIGZpbmlzaGVkIHdpdGggdGhlIGN1cnJlbnQgcmVxdWVzdCBub3dcclxuXHRcdGN1cnJlbnRSZXF1ZXN0ID0gdW5kZWZpbmVkO1xyXG5cdFx0XHJcblx0XHQvL3ZhciBqc29uID0gdGhpcy5yZXNwb25zZTsgIC8vLyBhbHJlYWR5IGluIEpTT04gZm9ybWF0LCBkb24ndCBuZWVkOiBcclxuXHRcdHZhciBqc29uID0gSlNPTi5wYXJzZSggdGhpcy5yZXNwb25zZSApO1xyXG5cclxuXHRcdC8vIHdlJ2xsIHB1dCBhIG1ldGFkYXRhIGZpZWxkIGluIHRoZSBvYmplY3QsIGp1c3QgdG8gYmUgc3VyZSBpdCdzIG9uZSBvZiBvdXJzXHJcblx0XHR2YXIgbWV0YWRhdGEgPSBqc29uLm1ldGFkYXRhO1xyXG5cdFx0aWYgKCBtZXRhZGF0YSAhPT0gdW5kZWZpbmVkICkge1xyXG5cdFx0XHRpZiAoIG1ldGFkYXRhLnR5cGUgIT09ICd0cmlhbmdsZXMnICkge1xyXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoICdMb2FkZXI6ICcgKyB1cmwgKyAnIHNob3VsZCBiZSBhIFwidHJpYW5nbGVzXCIgZmlsZXMuJyApO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y29uc29sZS5lcnJvciggJ0xvYWRlcjogJyArIHVybCArICcgZG9lcyBub3QgaGF2ZSBhIG1ldGFkYXRhIGZpZWxkLicgKTtcclxuXHRcdFx0cmV0dXJuO1x0XHRcdFx0XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIG9iamVjdCA9IHZhbGlkYXRlKCBqc29uLCB1cmwgKTtcclxuXHRcdFxyXG5cdFx0aWYgKG9iamVjdCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKFwiTG9hZGVyOiBcIiArIHVybCArIFwiIGNvbnRhaW5zIFwiICsgb2JqZWN0LnYubGVuZ3RoICsgXCIgdmVydGljZXMgXCIgK1xyXG5cdFx0XHRcdFwiIGFuZCBcIiArIG9iamVjdC50Lmxlbmd0aCArIFwiIHRyaWFuZ2xlcy5cIilcclxuXHRcdH1cclxuXHRcdG9uTG9hZCggb2JqZWN0ICk7XHJcblx0fSwgZmFsc2UgKTtcclxuXHJcblx0aWYgKCBvblByb2dyZXNzICE9PSB1bmRlZmluZWQgKSB7XHJcblx0XHRyZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoICdwcm9ncmVzcycsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcblx0XHRcdG9uUHJvZ3Jlc3MoIGV2ZW50ICk7XHJcblx0XHR9LCBmYWxzZSApO1xyXG5cdH1cclxuXHJcblx0aWYgKCBvbkVycm9yICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgZnVuY3Rpb24gKCBldmVudCApIHtcclxuXHRcdFx0Y3VycmVudFJlcXVlc3QgPSB1bmRlZmluZWQ7IC8vIHJlcXVlc3QgZmFpbGVkLCBjbGVhciB0aGUgY3VycmVudCByZXF1ZXN0IGZpZWxkXHJcblx0XHRcdGlmICggb25FcnJvciApIG9uRXJyb3IoIGV2ZW50ICk7XHJcblx0XHR9LCBmYWxzZSApO1xyXG5cdH1cclxuXHJcblx0Ly8gYXNrIGZvciBhIFwianNvblwiIGZpbGVcclxuXHQvL3JlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJqc29uXCI7XHJcblx0cmVxdWVzdC5zZW5kKCBudWxsICk7XHJcblxyXG5cdHJldHVybiByZXF1ZXN0O1xyXG59XHJcblxyXG4vLyB2YWxpZGF0ZSB0aGUgcmVjZWl2ZWQgSlNPTiwganVzdCB0byBtYWtlIHN1cmUgaXQncyB3aGF0IHdlIGFyZSBleHBlY3RpbmcgKGFuZCB0aHVzIGF2b2lkXHJcbi8vIGJ1Z3MgZG93biB0aGUgcm9hZCBpbiBvdXIgY29kZSlcclxuZnVuY3Rpb24gdmFsaWRhdGUoanNvbjogYW55LCB1cmw6IHN0cmluZyk6IE1lc2gge1xyXG5cdGlmIChqc29uIGluc3RhbmNlb2YgT2JqZWN0ICYmIFxyXG5cdFx0XHRqc29uLmhhc093blByb3BlcnR5KCd0JykgJiZcclxuXHRcdFx0anNvbi50IGluc3RhbmNlb2YgQXJyYXkgJiYgXHRcclxuXHRcdFx0anNvbi5oYXNPd25Qcm9wZXJ0eSgndicpICYmXHJcblx0XHRcdGpzb24udiBpbnN0YW5jZW9mIEFycmF5KSB7XHJcblxyXG5cdCAgICB2YXIgbnVtViA9IGpzb24udi5sZW5ndGg7XHJcblx0XHRmb3IgKHZhciBpIGluIGpzb24udCkge1xyXG5cdFx0XHRpZiAoIShqc29uLnRbaV0gaW5zdGFuY2VvZiBBcnJheSAmJlxyXG5cdFx0XHRcdGpzb24udFtpXS5sZW5ndGggPT0gMyAmJlxyXG5cdFx0XHRcdHR5cGVvZiBqc29uLnRbaV1bMF0gPT0gXCJudW1iZXJcIiAmJlxyXG5cdFx0XHRcdHR5cGVvZiBqc29uLnRbaV1bMV0gPT0gXCJudW1iZXJcIiAmJlxyXG5cdFx0XHRcdHR5cGVvZiBqc29uLnRbaV1bMl0gPT0gXCJudW1iZXJcIiAmJiBcclxuXHRcdFx0XHRqc29uLnRbaV1bMF0gPCBudW1WICYmXHJcblx0XHRcdFx0anNvbi50W2ldWzFdIDwgbnVtViAmJlxyXG5cdFx0XHRcdGpzb24udFtpXVsyXSA8IG51bVYpKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coXCJMb2FkZXI6IGpzb24gZmlsZSBcIiArIHVybCArIFwiLCBpbnZhbGlkIHRbXCIgKyBpICsgXCJdLlwiKTtcclxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1x0XHRcdFx0XHRcdCAgXHJcblx0XHRcdH1cclxuXHRcdH0gXHJcblx0XHRmb3IgKHZhciBpIGluIGpzb24udikge1xyXG5cdFx0XHRpZiAoIShqc29uLnZbaV0gaW5zdGFuY2VvZiBBcnJheSAmJlxyXG5cdFx0XHRcdGpzb24udltpXS5sZW5ndGggPT0gMyAmJlxyXG5cdFx0XHRcdHR5cGVvZiBqc29uLnZbaV1bMF0gPT0gXCJudW1iZXJcIiAmJlxyXG5cdFx0XHRcdHR5cGVvZiBqc29uLnZbaV1bMV0gPT0gXCJudW1iZXJcIiAmJlxyXG5cdFx0XHRcdHR5cGVvZiBqc29uLnZbaV1bMl0gPT0gXCJudW1iZXJcIikpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkxvYWRlcjoganNvbiBmaWxlIFwiICsgdXJsICsgXCIsIGludmFsaWQgdltcIiArIGkgKyBcIl0uXCIpO1xyXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XHRcdFx0XHRcdFx0ICBcclxuXHRcdFx0fVxyXG5cdFx0XHRpKys7XHJcblx0XHR9IFxyXG5cdFx0cmV0dXJuIDxNZXNoPmpzb247ICBcclxuXHR9IGVsc2Uge1xyXG5cdFx0Y29uc29sZS5sb2coXCJMb2FkZXI6IGpzb24gZmlsZSBcIiArIHVybCArIFwiIGRvZXMgbm90IGhhdmUgLnQgYW5kIC52IG1lbWJlcnMuXCIpO1xyXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcclxuXHR9XHJcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
