import {
    near,
    JSONValue,
    json,
    ipfs,
    log,
    TypedMap,
} from "@graphprotocol/graph-ts";
import { Event, Host } from "../generated/schema";

export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
    const actions = receipt.receipt.actions;
    for (let i = 0; i < actions.length; i++) {
        handleAction(actions[i], receipt);
    }
}

function handleAction(
    action: near.ActionValue,
    receipt: near.ReceiptWithOutcome
): void {
    if (action.kind != near.ActionKind.FUNCTION_CALL) {
        return;
    }

    const outcome = receipt.outcome;
    const funcitonCall = action.toFunctionCall();
    const methodName = funcitonCall.methodName;

    if (methodName == "createEvent") {
        for (let logIndex = 0; logIndex < outcome.logs.length; logIndex++) {
            const outcomeLog = outcome.logs[logIndex].toString();

            const jsonData = json.try_fromString(outcomeLog);

            const jsonObject = jsonData.value.toObject();

            let id = jsonObject.get("id");
            if (id) {
                let event = new Event(id.toString());
                let title = jsonObject.get("title");
                let active = jsonObject.get("active");
                let price = jsonObject.get("price");
                let timestamp = jsonObject.get("timestamp");
                event.title = (title as JSONValue).toString();
                event.active = (active as JSONValue).toBool();
                event.price = (price as JSONValue).toString();
                event.timestamp = (timestamp as JSONValue).toBigInt();

                let hostFromJson = jsonObject.get("host");
                if (hostFromJson) {
                    let hostObject = hostFromJson.toObject();
                    let name = hostObject.get("name") as JSONValue;
                    let address = hostObject.get("accountId") as JSONValue;
                    let host = new Host(name.toString());
                    host.name = name.toString();
                    host.address = address.toString();
                    event.host = host.id;
                    host.save();
                }
                event.save();
            }
        }
    }
}

// function handleObjects(jsonObject: TypedMap<string, JSONValue>): void {
//     jsonObject.entries.forEach((entry) => {
//         switch (entry.value.kind) {
//             case 1:
//                 log.info("entry {} {} {}", [
//                     entry.key,
//                     entry.value.kind.toString(),
//                     entry.value.toBool().toString(),
//                 ]);
//                 break;
//             case 2:
//                 log.info("entry {} {} {}", [
//                     entry.key,
//                     entry.value.kind.toString(),
//                     entry.value.toU64().toString(),
//                 ]);
//                 break;
//             case 3:
//                 log.info("entry {} {} {}", [
//                     entry.key,
//                     entry.value.kind.toString(),
//                     entry.value.toString(),
//                 ]);
//                 break;
//             case 5:
//                 handleObjects(entry.value.toObject());
//                 break;
//         }
//     });
// }
