const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const Alexa = require('ask-sdk');
const axios = require('axios');
const https = require('https');
const http = require('http');
var cart = [];
let skill;

exports.handler = async function(event, context) {
    debugger;
    //console.log('REQUEST ' + JSON.stringify(event));
    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .addErrorHandlers(ErrorHandler)
            .addRequestHandlers(
                // delete undefined built-in intent handlers

                LaunchRequestHandler,
                LaPlazaHandler,
                AskPriceHandler,
                AskQuantityHandler,
                CheckOutHandler,
                CartCheckoutHandler

            ).create();
    }

    const response = await skill.invoke(event, context);
    //console.log('RESPONSE :' + JSON.stringify(response));
    return response;
};
const LaPlazaHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'LaPlaza';
    },
    async handle(handlerInput) {
        // invoke custom logic of the handler
        const product = String(Alexa.getSlotValue(handlerInput.requestEnvelope, 'product'));
        const cantidad = Number(Alexa.getSlotValue(handlerInput.requestEnvelope, 'cantidad'));

        let speechText = 'Pruebe de nuevo';
        var art;
        try {

            const response = await getProduct(`https://8aceaf3aab77777feab731687cf6e1d5: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@laplazashop.myshopify.com`, `admin/api/2020-07/products.json?title=${product}`)
            art = JSON.parse(response);

            var id = art.products.map(function(art) {
                console.log(art.variants[0].id)
                return art.variants[0].id
            })

            var product_id = art.products.map(function(art) {
                console.log(art.variants[0].product_id)
                return art.variants[0].product_id
            })

            var product_price = art.products.map(function(art) {
                console.log(art.variants[0].price)
                return art.variants[0].price
            })

            var data = art.products.map(function(art) {


                return art.variants[0].inventory_quantity;
            })

            if (data > cantidad) {
                cart.push({ variant_id: id, product_id: product_id, quantity: cantidad, price: product_price })
                speechText = product + ' agregado a la canasta satisfactoriamente'
                if (cantidad > 1) {
                    speechText = cantidad + ' unidades de ' + product + ' agregado a la canasta satisfactoriamente'
                }

            } else {
                speechText = 'La cantidad solicitada de ' + product + 'supera el stock actual'

            }
        } catch (error) {

            speechText = product + ' no se encuentra en La Plaza actualmente'

        }


        /** 
        let data = await ddb.get({
            TableName: "LaPlaza",
            Key: {
                Name: product
            }
        }).promise();
        */






        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(false)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle(handlerInput) {
        return true;
    },
    handle(handlerInput, error) {
        console.log('Error handled: ' + JSON.stringify(error.message));
        // console.log('Original Request was:', JSON.stringify(handlerInput.requestEnvelope.request, null, 2));

        const speechText = 'No sirve';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(false)
            .getResponse();
    }
};


const AskPriceHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'AskPrice';
    },
    async handle(handlerInput) {
        // invoke custom logic of the handler
        const product = String(Alexa.getSlotValue(handlerInput.requestEnvelope, 'product'));

        let speechText = 'Sirve';
        var art_price;
        try {

            const response = await getProduct(`https://8aceaf3aab77777feab731687cf6e1d5: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@laplazashop.myshopify.com`, `admin/api/2020-07/products.json?title=${product}`)
            art_price = JSON.parse(response);

            var data = art_price.products.map(function(art_price) {


                return art_price.variants[0].price;
            })



        } catch (error) {

            speechText = product + ' no se encuentra en La Plaza actualmente'

        }
        speechText = 'Su precio es de ' + data + ' pesos'


        /** 
        let data = await ddb.get({
            TableName: "LaPlaza",
            Key: {
                Name: product
            }
        }).promise();
        */






        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(false)
            .getResponse();
    }
};

const AskQuantityHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'AskQuantity';
    },
    async handle(handlerInput) {
        // invoke custom logic of the handler
        const product = String(Alexa.getSlotValue(handlerInput.requestEnvelope, 'product'));

        let speechText = 'Pruebe de nuevo';
        var art_quantity;
        try {

            const response = await getProduct(`https://8aceaf3aab77777feab731687cf6e1d5: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@laplazashop.myshopify.com`, `admin/api/2020-07/products.json?title=${product}`)
            art_quantity = JSON.parse(response);

            var data = art_quantity.products.map(function(art_quantity) {


                return art_quantity.variants[0].inventory_quantity;
            })

            if (data > 0) {
                speechText = 'Existen' + data + ' disponibles en stock'
            }
        } catch (error) {

            speechText = product + ' no se encuentra en La Plaza actualmente'

        }



        /** 
        let data = await ddb.get({
            TableName: "LaPlaza",
            Key: {
                Name: product
            }
        }).promise();
        */






        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(false)
            .getResponse();
    }
};

const CheckOutHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'CheckOut';
    },
    async handle(handlerInput) {
        // invoke custom logic of the handler
        const product = String(Alexa.getSlotValue(handlerInput.requestEnvelope, 'product'));
        const cantidad = Number(Alexa.getSlotValue(handlerInput.requestEnvelope, 'cantidad'));

        let speechText = 'Pruebe de nuevo';
        var art_checkout;
        try {

            const response = await getProduct(`https://8aceaf3aab77777feab731687cf6e1d5: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@laplazashop.myshopify.com`, `admin/api/2020-07/products.json?title=${product}`)
            art_checkout = JSON.parse(response);
            var availability = art_checkout.products.map(function(art_checkout) {


                return art_checkout.variants[0].inventory_quantity;
            })
            var id = art_checkout.products.map(function(art_checkout) {


                return art_checkout.variants[0].id;
            })

            var title = art_checkout.products.map(function(art_checkout) {
                return art_checkout.title
            })

            var price = art_checkout.products.map(function(art_checkout) {
                return art_checkout.variants[0].price
            })
            console.log('Producto: ' + title)

            if (cantidad > 1 && product == title) {
                if (availability > cantidad) {
                    var total = price * cantidad;
                    postOrder(id, cantidad)
                    speechText = 'Total a pagar de ' + total + ' pesos, que forma de pago desea utilizar?'

                } else {
                    speechText = 'La cantidad solicitada supera el stock disponible.'
                }
            } else if (product == title) {
                postOrder(id, 1)

                speechText = 'Total a pagar de ' + price + ' pesos, que forma de pago desea utilizar?'

            } else {
                speechText = product + ' no se encuentra en La Plaza actualmente'
            }




        } catch (error) {

            speechText = product + ' no se encuentra en La Plaza actualmente'
            console.log(JSON.stringify(error.message));
        }



        /** 
        let data = await ddb.get({
            TableName: "LaPlaza",
            Key: {
                Name: product
            }
        }).promise();
        */






        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(false)
            .getResponse();
    }
};

const CartCheckoutHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
            handlerInput.requestEnvelope.request.intent.name === 'CartCheckout';
    },
    async handle(handlerInput) {
        // invoke custom logic of the handler


        let speechText = 'Pruebe de nuevo';

        var total = 0;
        try {

            for (cart_item of cart) {

                console.log("Product Id: " + cart_item.product_id)
                console.log("Id: " + cart_item.variant_id + " precio:" + cart_item.price)

                postOrder(cart_item.variant_id, cart_item.quantity);
                total += cart_item.quantity * cart_item.price;
            }





            speechText = 'El monto a pagar es de ' + total + ' pesos, que forma de pago desea utilizar?'




        } catch (error) {

            speechText = 'No se pudo completar el checkout correctamente, intente más tarde'
            console.log(JSON.stringify(error.message));
        }



        /** 
        let data = await ddb.get({
            TableName: "LaPlaza",
            Key: {
                Name: product
            }
        }).promise();
        */






        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(false)
            .getResponse();
    }
};


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Bienvenido a La Plaza, ¿en que puedo ayudarle?';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(false)
            .getResponse();
    }
};

const getProduct = function(url, query) {
    return new Promise((resolve, reject) => {
        const request = https.get(`${url}/${query}`, response => {
            response.setEncoding('utf8');

            let returnData = '';
            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
            }

            response.on('data', chunk => {
                returnData += chunk;
            });

            response.on('end', () => {
                resolve(returnData);
            });

            response.on('error', error => {
                reject(error);
            });
        });
        request.end();
    });
}

const postOrder = function(id, cantidad) {


    var options = {
        "method": "POST",
        "url": 'https://8aceaf3aab77777feab731687cf6e1d5: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@laplazashop.myshopify.com/admin/api/2020-10/orders.json',
        "port": null,

        "headers": {
            "cookie": "__cfduid=d57c5e10be29bb2520d4f5752d1dbabb71601090878",
            "content-type": "application/json",
            "content-length": "122"
        }
    };

    var req = http.request(options, function(res) {
        var chunks = [];

        res.on("data", function(chunk) {
            chunks.push(chunk);
        });

        res.on("end", function() {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    req.write(JSON.stringify({
        order: {
            line_items: [
                { variant_id: id, quantity: cantidad }

            ]
        }
    }));
    req.end();




}