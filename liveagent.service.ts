namespace LiveagentModule {

	const APIURL = '/webapi/chat/SFLiveAgentEntry';

	export class Liveagent {
		private chatID = '573b0000000GxOJ';
		private orgID = '00D7E0000000dRE';
		private deploymentID = '572b0000000GsPJ';


		private chatInstance = {
			affinityToken: '',
			id: '',
			key: '',
			sequence: 0,
			ack: -1
		};

		private _messages = [];

		private doHttp(obj) {
			return this.$http({
				method: 'POST',
				url: APIURL,
				data: angular.merge({
						method: 'GET',
						url: '',
						headers: { 'X-LIVEAGENT-API-VERSION' : '37' },
						body: { }
					}, obj)
				}).then(response => {
					return this.handleResponse(response.data);
				});
		}

		private availabilitySubject = new Rx.BehaviorSubject();
		public availabilityChange$ = this.availabilitySubject.asObservable();

		public messages$ = new Rx.Observable.create(observer => {
			this.messagesChanges = observer;

			this.initiateChat();

			return () => {
				this.endChat();
			};
		});
		private messagesChanges;

		private checkIfOnline() {
			this.doHttp({
				method: 'GET',
				url: '/Visitor/Availability',
				body:{ org_id: this.orgID, deployment_id: this.deploymentID, 'Availability.ids': this.chatID }
			}).then(online => {
				if(online) { return; }
				setTimeout(() => {
					this.checkIfOnline();
				}, 30000);
			});
		}

		private listenForEvents() {
			this.doHttp({
				method: 'GET',
				url: '/System/Messages',
				headers: {
					'X-LIVEAGENT-AFFINITY': this.chatInstance.affinityToken,
					'X-LIVEAGENT-SESSION-KEY': this.chatInstance.key,
					'X-LIVEAGENT-SEQUENCE': this.chatInstance.sequence			
				},
				body:{
					ack: this.chatInstance.ack
				} 
			}).finally(() => {
				//using finally so both resolve and reject starts listening again...
				if(this.chatInstance.affinityToken) {
					this.listenForEvents();
				}
			});
		}

		private initiateChat() {
			this.availabilitySubject.onNext('initiating');
			//create session ID
			this.doHttp({
				url: '/System/SessionId',
				method: 'GET',
				headers: { 'X-LIVEAGENT-AFFINITY': 'null' },
				body: { }
			}).then(res => {
				this.chatInstance.affinityToken = res.affinityToken;
				this.chatInstance.id = res.id;
				this.chatInstance.key = res.key;
				this.chatInstance.sequence = 1;
				//Initate chat
				return this.doHttp({
					method: 'POST',
					url: '/Chasitor/ChasitorInit', 
					headers: {
						'X-LIVEAGENT-AFFINITY': this.chatInstance.affinityToken,
						'X-LIVEAGENT-SESSION-KEY': this.chatInstance.key,
						'X-LIVEAGENT-SEQUENCE': this.chatInstance.sequence
					},
					body: {
						'organizationId': this.orgID,
						'deploymentId': this.deploymentID,
						'buttonId': this.chatID,
						'doFallback': true,
						'sessionId': this.chatInstance.id,
						'userAgent': navigator.userAgent,
						'language': navigator.language || 'n/a',
						'screenResolution': screen.width + 'x' + screen.height,
						'visitorName': '',
						'prechatDetails': [
							{
								'label': 'First Name',
								'value': '',
								'displayToAgent': true,
								'entityMaps': [],
								'transcriptFields': []
							},
							{
								'label': 'Last Name',
								'value': '',
								'displayToAgent': true,
								'entityMaps': [],
								'transcriptFields': []
							},
							{
								'label': 'Email',
								'value': '',
								'displayToAgent': true,
								'entityMaps': [],
								'transcriptFields': []
							},
							{
								'label': 'Case Subject',
								'value': 'Chat Request',
								'displayToAgent': true,
								'entityMaps': [],
								'transcriptFields': []
							},
							{
								'label': 'Case Status',
								'value': 'New',
								'displayToAgent': true,
								'entityMaps': [],
								'transcriptFields': []
							}
						],
						'prechatEntities': [
							{
								'entityName': 'Case',
								'saveToTranscript': 'CaseID',
								'showOnCreate': true,
								'linkToEntityName': '',
								'linkToEntityField': '',
								'entityFieldsMaps': [
									{
										'fieldName': 'Subject',
										'label': 'Case Subject',
										'doFind': false,
										'isExactMatch': false,
										'doCreate': true
									},
									{
										'fieldName': 'Status',
										'label': 'Case Status',
										'doFind': false,
										'isExactMatch': false,
										'doCreate': true
									}
								]
							},
							{
								'entityName': 'Contact',
								'saveToTranscript': 'ContactID',
								'showOnCreate': false,
								'linkToEntityName': 'Case',
								'linkToEntityField': 'ContactId',
								'entityFieldsMaps': [
									{
										'fieldName': 'FirstName',
										'label': 'First Name',
										'doFind': false,
										'isExactMatch': false,
										'doCreate': false
									},
									{
										'fieldName': 'LastName',
										'label': 'Last Name',
										'doFind': false,
										'isExactMatch': false,
										'doCreate': false
									},
									{
										'fieldName': 'Email',
										'label': 'Email',
										'doFind': true,
										'isExactMatch': true,
										'doCreate': false
									}
								]
							}
						],
						'buttonOverrides': [],
						'receiveQueueUpdates': true,
						'isPost': true
					}
				});
			}).then(res => {
				// Chat is now being initiated. Chat will be activated when the event chatstart is received
				this.chatInstance.sequence++;
				this.listenForEvents();
			});
		}

		private endChat() {
			this.doHttp({
				method: 'POST',
				url: '/Chasitor/ChatEnd',
				headers: {
					'X-LIVEAGENT-AFFINITY': this.chatInstance.affinityToken,
					'X-LIVEAGENT-SESSION-KEY': this.chatInstance.key,
					'X-LIVEAGENT-SEQUENCE': this.chatInstance.sequence
				}, 
				body: {
					ack: this.chatInstance.ack
				}
			});
			this._messages = [];
		}

		private handleAvailability(results:any[]) {
			let availability = !!results.filter(res=>res.id===this.chatID)[0].isAvailable;
			this.availabilitySubject.onNext(availability ? 'online' : 'offline');
			return availability;
		}

		private addMessage(msg) {
			this._messages = [...this._messages, msg ];
			this.messagesChanges.onNext(this._messages);
		}

		private handleResponse(data) {
			if(data.hasOwnProperty('sequence')) {
				this.chatInstance.ack = data.sequence;
			}
			if(data.messages) {
				let message = data.messages[0];
				if (message.type === 'Availability') {
					return this.handleAvailability(message.message.results);
				}
				if (message.type === 'ChatMessage') {
					return this.addMessage(message.message);
				}
				if(message.type === 'ChatEstablished') {
					this.availabilitySubject.onNext('established');
				}
				if(message.type === 'ChatEnded') {
					this.availabilitySubject.onNext('ended');
					this.chatInstance.affinityToken = '';
					this.chatInstance.id = '';
					this.chatInstance.key = '';
					this.chatInstance.sequence = 0;
					this.chatInstance.ack = -1;
					this._messages = [];
				}
			}

			return data;
		} 

		public send(text) {
			if(!text) {
				return;
			}
			return this.doHttp({
				method: 'POST',
				url: '/Chasitor/ChatMessage',
				headers: {
					'X-LIVEAGENT-AFFINITY': this.chatInstance.affinityToken,
					'X-LIVEAGENT-SESSION-KEY': this.chatInstance.key,
					'X-LIVEAGENT-SEQUENCE': this.chatInstance.sequence
				},
				timeout: 40000,
				body: { 
					text,
					ack: this.chatInstance.ack
				}
			}).then(_=> {
				this.chatInstance.sequence++;
				this._messages = [...this._messages,{
					text
				}];
				this.messagesChanges.onNext(this._messages);	
			});
		}

		constructor(
			private $http:ng.IHttpService
		) {
			this.checkIfOnline();
		}
	}

	angular.module(moduleId).service('Liveagent', Liveagent);
}
