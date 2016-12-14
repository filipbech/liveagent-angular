namespace LiveagentModule {

    class LiveagentController {

        public messages = [];
        public comment = '';
        public status = '';
        public translations;
        private containerElement: HTMLDivElement;
        private subscription;

		constructor(
			private Liveagent: Liveagent,
            private $element: ng.IRootElementService
        ) { }


        send(comment) {
            this.Liveagent.send(comment);
        }

        $onInit() {
            this.subscription = this.Liveagent.messages$.subscribe((allmessages) => {
                this.messages = allmessages;
                //make sure we scroll to the bottom of the page
                setTimeout(() => {
                    this.containerElement.scrollTop = this.containerElement.scrollHeight;
                }, 0);
            });

            this.Liveagent.availabilityChange$.subscribe(status => {
                this.status = status;
            });

            this.containerElement = this.$element[0].querySelector('.messages') as HTMLDivElement;

            this.$element.find('textarea').on('keyup', (event:any) => {
                if(!event.shiftKey) {
                    if(event.which === 13 || event.key === 'Enter') {
                        this.send(event.target.value);
                        event.target.value = '';
                        event.preventDefault();
                        return false;
                    }
                }
            });
        }

        $onDestroy() {
            this.subscription.dispose();
        }

    }

    class LiveagentComponent implements ng.IComponentOptions {

        public bindings:any;
        public controller:any;
        public template:string;

        constructor() {
            this.bindings = {};
            this.controller = LiveagentController;
            this.template = `
                <div ng-show="$ctrl.status === 'established'" class="chat-container">
                    <div class="messages">
                        <div ng-repeat="message in $ctrl.messages" class="chat-message" ng-class="{you:!message.name}">
                            <span ng-bind="message.name || 'dig'" class="sender"></span>
                            <span ng-bind="message.text" class="message"></span>
                        </div>
                    </div>
                    <form>
                        <textarea placeholder="type here..."></textarea>
                    </form>
                </div>
                <div ng-show="$ctrl.status !== 'established'" class="chat-container" ng-class="$ctrl.status">
                    <h5>{{$ctrl.status}}...</h5>
                </div>
            `;
        }
    }

    angular.module(moduleId).component('liveagent', new LiveagentComponent());

}
