export = Square;
declare class Square {
    constructor({ api_key, application_id, location_id, }: {
        api_key: any;
        application_id: any;
        location_id: any;
    });
    application_id: any;
    location_id: any;
    api_key: any;
    server: any;
    return_url: string | undefined;
}
