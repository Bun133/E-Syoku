import {PrettyGoods, WaitingData} from "@/lib/e-syoku-api/Types";
import {Card, CardBody, CardHeader} from "@chakra-ui/card";
import {Heading} from "@chakra-ui/layout";

export default function Goods(param: { goods: PrettyGoods, waiting: WaitingData, footer?: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <Heading size={"md"}>
                    {param.goods.name}
                </Heading>
            </CardHeader>
            <CardBody>
                商品説明：{param.goods.description}
                <br/>
                商品単価：{param.goods.price}円
                <br/>
                受け取り待ちの人数：{param.waiting.waiting}人
            </CardBody>
            {param.footer}
        </Card>
    )
}