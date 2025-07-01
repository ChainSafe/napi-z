const std = @import("std");
const c = @import("c.zig");

const Value = @import("Value.zig");

env: c.napi_env,
values: []c.napi_value,

const Values = @This();

pub fn get(self: Values, index: usize) Value {
    return Value{
        .env = self.env,
        .value = self.values[index],
    };
}
