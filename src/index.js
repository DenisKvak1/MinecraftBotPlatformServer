"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AccountService_1 = require("./core/service/AccountService");
AccountService_1.accountService.create({
    nickname: 'test',
    server: '123',
    port: 134
}).then(function (data) {
    console.log(data);
});
