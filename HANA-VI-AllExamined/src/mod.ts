import { DependencyContainer } from "tsyringe";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod"; // 3.11의 최종 단계 인터페이스
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { ILogger } from "@spt/models/spt/utils/ILogger";

class AllExamined implements IPostSptLoadMod 
{
    // postDBLoad가 아닌 postSptLoad를 사용 (비동기 모드들을 제압하는 최종 병기)
    public postSptLoad(container: DependencyContainer): void 
    {
        const logger = container.resolve<ILogger>("WinstonLogger");
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const tables = databaseServer.getTables();
        const items = tables.templates.items;

        logger.info("--- HANAVI's All Examined Starting ---");

        let count = 0;
        for (const id in items) 
        {
            // 이 시점에는 Wolfiks 같은 비동기 모드의 아이템들도 이미 DB에 들어와 있어
            if (items[id]?._props) {
                items[id]._props.ExaminedByDefault = true;
                count++;
            }
        }

        logger.info(`--- Successfully examined ${count} items ---`);
    }
}

export const mod = new AllExamined();