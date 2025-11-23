export function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
export function ok(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
}
export function fail(res, error, status = 400) {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
    return res.status(status).json({ success: false, error: message });
}
