import {Goods} from "@/lib/e-syoku-api/Types";
import {Card, CardBody, CardHeader} from "@chakra-ui/card";
import {Heading} from "@chakra-ui/layout";

export default function Goods(param: { goods: Goods }) {
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
                商品価格：{param.goods.price}円
            </CardBody>
        </Card>
    )
}