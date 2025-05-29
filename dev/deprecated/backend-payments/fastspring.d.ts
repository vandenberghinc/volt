export = FastSpring;
declare class FastSpring {
    constructor({ username, password, server, }: {
        username: any;
        password: any;
        server: any;
    });
    client: any;
    server: any;
    _sys_has_cid(uid: any): any;
    _sys_load_cid(uid: any): any;
    _sys_load_uid_by_cid(cid: any): any;
    _sys_save_cid(uid: any, cid: any): void;
    _sys_delete_cid(uid: any, cid: any): void;
    get_cid(uid: any): Promise<any>;
    create_customer(email: any, first_name: any, last_name: any): Promise<any>;
    delete_customer(): Promise<void>;
    update_customer(uid: any, user: any, country: any): Promise<void>;
}
