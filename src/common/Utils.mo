module {
    public func find<T>(list : [T], predicate : T -> Bool) : ?T {
        for (item in list.vals()) {
            if (predicate(item)) {
                return ?item;
            };
        };
        null;
    };
}