"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mod = void 0;
class AllExamined {
    // postDBLoad가 아닌 postSptLoad를 사용 (비동기 모드들을 제압하는 최종 병기)
    postSptLoad(container) {
        const logger = container.resolve("WinstonLogger");
        const databaseServer = container.resolve("DatabaseServer");
        const tables = databaseServer.getTables();
        const items = tables.templates.items;
        logger.info("--- HANAVI's All Examined Starting ---");
        let count = 0;
        for (const id in items) {
            // 이 시점에는 Wolfiks 같은 비동기 모드의 아이템들도 이미 DB에 들어와 있어
            if (items[id]?._props) {
                items[id]._props.ExaminedByDefault = true;
                count++;
            }
        }
        logger.info(`--- Successfully examined ${count} items ---`);
    }
}
exports.mod = new AllExamined();
//# sourceMappingURL=mod.js.map