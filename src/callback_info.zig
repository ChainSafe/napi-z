const c = @import("c.zig");
const status = @import("status.zig");
const NapiError = @import("status.zig").NapiError;
const Value = @import("Value.zig");

pub fn CallbackInfo(comptime DataType: type) type {
    return struct {
        env: c.napi_env,
        args: []c.napi_value,
        this_arg: c.napi_value,
        data: *DataType,

        const Self = @This();

        /// https://nodejs.org/api/n-api.html#napi_get_cb_info
        pub fn init(env: c.napi_env, cb_info: c.napi_callback_info, args: []c.napi_value) NapiError!Self {
            var info = Self{
                .env = env,
                .args = args,
                .this_arg = undefined,
                .data = undefined,
            };

            var initial_argc = args.len;

            try status.check(
                c.napi_get_cb_info(env, cb_info, &initial_argc, info.args.ptr, &info.this_arg, @ptrCast(&info.data)),
            );
            if (initial_argc != args.len) {
                // If the number of arguments is different, we need to resize the slice
                info.args = info.args[0..initial_argc];
            }

            return info;
        }

        pub fn arg(self: Self, index: usize) Value {
            return Value{
                .env = self.env,
                .value = self.args[index],
            };
        }

        pub fn argc(self: Self) usize {
            return self.args.len;
        }

        pub fn this(self: Self) Value {
            return Value{
                .env = self.env,
                .value = self.this_arg,
            };
        }
    };
}
