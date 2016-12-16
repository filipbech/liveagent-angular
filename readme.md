#Salesforce Liveagent Client with Angular 1.5+

THIS IS STILL WORK IN PROGRESS! The service will work, but the server part is not yet available (and wont be for all platforms). Also since you need a salesforce liveagent licence to use this,  the demo won't work. 
If you can't make this work or have questions please reach out on twitter @filipbech - I'm happy to help! 

##Why
Salesforce Liveagent is an online customer-service chat client, but unfortunatly the official way of implementing it is either via an iframe, or via a popup-window. Neither of which are fully customizable or very nice to work with. 
So I did some reverse-engineering of how their own implementation works, and re-implemented it as an angular 1.x service (holds all the magic/logic and should be pretty easy to port to any other framework) and a chat-component. 

##Technology
It uses `Angular 1.x` (the component requires v.1.5+ but the service should work with any version). Its build with `observables` using `RxJS 4.x`, so the service can publish multiple observables that can be subscribed to. It only uses very basic observable-stuff, so if you know RxJS I'm sure you can upgrade to the new version 5.x with more or less just a search-replace.  

##On the server
Because the chat-client now lives on your domain, we run into some CORS limitations (the api-endpoint only works for the salesforce domain), so you need some proxy thing on your server. In the ´liveagent.service.ts´ file you define the const that holds the api-endpoint on your server. Everytime we need a request to go to salesforce, a POST-request will be sent to your server with an object containing the method, url, headers and body of the request.

##Demo
Download this repository and spin up the example-component to see it in action. (requires the server-thing that you have to build yourself).
`<example></example>`

##How does it work
If you are anything like me, you would want to know how this actually works. When the service is instantiated (first time its a dependency) it starts `polling` for availibility status at a given interval (30sec is the default). Once a chat is initiated the server-client messaging is made by `long-polling`. Long-polling basically just means that there is always an open connection between the server and the client. In a request-response world (http) this is made possible by the server just not responding to the request before something happens. If nothing has happened when the request is just about to timeout, it will respond with nothing. Anytime the server responds, the client will imidiatly open a new request. 


