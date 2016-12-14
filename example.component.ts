namespace LiveagentModule {

	class ExampleController {

		public chatIsOnline = false;
		public chatIsOpen = false;

		private subscription;

		constructor(private Liveagent: Liveagent) { }

		$onInit() {
			this.subscription = this.Liveagent.availabilityChange$
				.distinctUntilChanged()
				.subscribe(status => {
					this.chatIsOnline = status === 'offline' ? false : true;
				});
		}
		$onDestroy() {
			//remember to dispose your subscription when the example component is destroyed
			this.subscription.dispose();
		}

		goToChat() {
			this.chatIsOpen = true;
		}

	}

	class ExampleComponent implements ng.IComponentOptions {

		public bindings: any;
		public controller: any;
		public template: string;

		constructor() {
			this.bindings = {};
			this.controller = ExampleController;
			this.template = `
				<h1>Lifeagent chat client</h1>
				<button ng-if="$ctrl.chatIsOnline" ng-click="$ctrl.goToChat();">Open chat</button>
				<div ng-if="!$ctrl.chatIsOnline">Chat is offline</div>

				<liveagent ng-if="$ctrl.chatIsOpen"></liveagent>

			`
		}
	}

	angular.module(moduleId).component('example', new ExampleComponent());

}
