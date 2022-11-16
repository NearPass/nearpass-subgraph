import {
    near,
    JSONValue,
    json,
    ipfs,
    log,
    TypedMap,
    Bytes,
    BigInt,
} from "@graphprotocol/graph-ts";
import { Event, FAQ, Host, Ticket } from "../generated/schema";

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

    log.info("methodName {}", [methodName]);

    if (methodName == "createEvent") {
        handleCreateEvent(outcome);
    }

    if (methodName == "buyTicketCallback") {
        handleBuyTicket(outcome);
    }

    if (methodName == "redeem") {
        handleRedeem(outcome);
    }
}

function handleCreateEvent(outcome: near.ExecutionOutcome): void {
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
            let eventMetadata = (jsonObject.get(
                "eventMetadata"
            ) as JSONValue).toObject();

            event.title = (title as JSONValue).toString();
            event.active = (active as JSONValue).toBool();
            event.price = (price as JSONValue).toString();
            event.timestamp = (timestamp as JSONValue).toBigInt();

            let hostFromJson = jsonObject.get("host");
            let hostObject = (hostFromJson as JSONValue).toObject();

            let name = hostObject.get("name") as JSONValue;
            let address = hostObject.get("accountId") as JSONValue;
            let host = new Host(name.toString());
            let faq = new FAQ(id.toString());

            host.name = name.toString();
            host.address = address.toString();
            event.host = host.id;

            if (eventMetadata) {
                let hostEmail = (eventMetadata.get(
                    "hostemail"
                ) as JSONValue).toString();
                let telegram = (eventMetadata.get(
                    "telegram"
                ) as JSONValue).toString();
                let discord = (eventMetadata.get(
                    "discord"
                ) as JSONValue).toString();
                let venue = (eventMetadata.get(
                    "venue"
                ) as JSONValue).toString();
                let eventType = (eventMetadata.get(
                    "eventType"
                ) as JSONValue).toString();

                event.description = (eventMetadata.get(
                    "description"
                ) as JSONValue).toString();
                event.thumbnail = (eventMetadata.get(
                    "thumbnail"
                ) as JSONValue).toString();

                event.eventType = eventType;
                event.venue = venue;
                event.telegram = telegram;
                event.discord = discord;
                event.attendees = BigInt.fromString("0");

                event.question1 = (eventMetadata.get(
                    "question1"
                ) as JSONValue).toString();
                event.question2 = (eventMetadata.get(
                    "question2"
                ) as JSONValue).toString();

                faq.question1 = (eventMetadata.get(
                    "faqquestion1"
                ) as JSONValue).toString();
                faq.question2 = (eventMetadata.get(
                    "faqquestion2"
                ) as JSONValue).toString();
                faq.answer1 = (eventMetadata.get(
                    "answer1"
                ) as JSONValue).toString();
                faq.answer2 = (eventMetadata.get(
                    "answer2"
                ) as JSONValue).toString();

                event.faq = faq.id;
                host.email = hostEmail;
            }
            faq.save();
            host.save();
            event.save();
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

function handleBuyTicket(outcome: near.ExecutionOutcome): void {
    for (let i = 0; i < outcome.logs.length; i++) {
        const outcomeLog = outcome.logs[i].toString();

        const jsonData = json.try_fromString(outcomeLog);

        const jsonObject = jsonData.value.toObject();

        const ticketId = jsonObject.get("ticketId");
        if (ticketId) {
            let ticket = new Ticket(ticketId.toString());
            let eventId = (jsonObject.get("eventId") as JSONValue).toString();
            let accountId = (jsonObject.get(
                "accountId"
            ) as JSONValue).toString();
            let used = (jsonObject.get("used") as JSONValue).toBool();
            let redeemable = (jsonObject.get(
                "redeemable"
            ) as JSONValue).toBool();
            let name = (jsonObject.get("name") as JSONValue).toString();
            let email = (jsonObject.get("email") as JSONValue).toString();
            let phone = (jsonObject.get("phone") as JSONValue).toString();
            let answer1 = (jsonObject.get("answer1") as JSONValue).toString();
            let answer2 = (jsonObject.get("answer2") as JSONValue).toString();

            ticket.answer1 = answer1;
            ticket.answer2 = answer2;
            ticket.used = used;
            ticket.redeemable = redeemable;
            ticket.name = name;
            ticket.email = email;
            ticket.phone = phone;
            ticket.accountId = accountId;

            ticket.event = eventId;
            let event = Event.load(eventId);
            if (event) {
                event.attendees = BigInt.fromI32(event.attendees.toI32() + 1);
                event.save();
            }

            ticket.save();
        }
    }
}

function handleRedeem(outcome: near.ExecutionOutcome): void {
    for (let i = 0; i < outcome.logs.length; i++) {
        const outcomeLog = outcome.logs[i].toString();
        const jsonData = json.try_fromString(outcomeLog);
        const jsonObject = jsonData.value.toObject();

        const ticketId = jsonObject.get("ticketId");
        if (ticketId) {
            let ticket = Ticket.load(ticketId.toString());
            if (ticket) {
                ticket.used = true;
                ticket.redeemable = false;
                ticket.save();
            }
        }
    }
}
