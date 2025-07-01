const c = @import("c.zig");
const status = @import("status.zig");
const NapiError = @import("status.zig").NapiError;

env: c.napi_env,
value: c.napi_value,

const Object = @This();
