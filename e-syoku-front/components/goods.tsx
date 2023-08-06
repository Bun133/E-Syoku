import {Goods, PrettyGoods} from "@/lib/e-syoku-api/Types";
import {Card, CardBody, CardHeader} from "@chakra-ui/card";
import {Heading} from "@chakra-ui/layout";

export default function Goods(param: { goods: PrettyGoods, footer?: React.ReactNode }) {
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
            </CardBody>
            {param.footer}
        </Card>
    )
}