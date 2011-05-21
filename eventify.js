/* Makes the given object observable, firing off events when the object's methods
 * are called. There are also some options availible for limiting which methods
 * trigger events. They can be passed in using an options object as the second
 * argument. There are two options. The names option can be an array of method
 * names to transform; if this is specified, methods without their name in the
 * array will not trigger events. The marked option dictates whether to transform
 * only "marked" methods. "Marked" methods are those that have a ._eventify
 * property that is not falsy.
 */
function eventify(object, options) {
    // Options:
    options = options || {};
    options.names = options.names || [];
    
    var marked = options.marked || false,
        checkNames = (options.names === []),
        names = {};// A set of names to conisder.

    for (var i = 0; i < options.names.length; i++) {
        names[options.names[i]] = true;
    }

    var observers = [];

    /* Returns whether the specified property is one to transform. */
    function check(property) {
        return (!checkNames || names[property]) &&
            (!marked || object[property]._eventify) &&
            (typeof object[property] == "function");
    }

    // Cause all of the methods to fire off events:
    for (var method in object) {
        eventifyMethod(method);
    }

    /* Eventifies the method with the given name, making it emit events every time
     * it is called. If the name passed in does not correspond to a method to be
     * be eventified (e.g. check(methodName) == false), then nothing happens.
     */
    function eventifyMethod(method) {
        var func = object[method];
        
        if (check(method)) {
            object[method] = function () {
                fire(new Event(method, arguments));
                return func.apply(object, arguments);
            };
        }
    }

    object._eventifyMethod = eventifyMethod;

    /* Fires the given event, calling all observers with it as the sole argument.
     * This checks that all the observers are functions before trying to call
     * them, removing any that are not functions.
     */
    function fire(event) {
        for (var i = 0; i < observers.length; i++) {
            if (typeof observers[i] == "function") {
                observers[i](event);
            } else {
                observers.splice(i, 1);
                i--;
            }
        }
    }

    /* Creates an Event that represents the change created by calling the
     * specified method (name) on the object with the given arguments.
     */
    function Event(method, arguments) {
        this.method = method;
        this.arguments = [];
        
        for (var i = 0; i < arguments.length; i++) {
            this.arguments.push(arguments[i]);
        }
    }

    // Add appropriate methods like addObserver:

    /* Adds the given observer to the object. */
    object.addObserver = function (observer) {
        observers.push(observer);
    };

    /* Removes the specified observer from the object. If the observer was added
     * more than once, only removes the first instance of the given observer.
     */
    object.removeObserver = function (observer) {
        for (var i = 0; i < observers.length; i++) {
            if (observers[i] === observer) {
                observers.splice(i, 1);
                i--;
                break;
            }
        }
    };
}