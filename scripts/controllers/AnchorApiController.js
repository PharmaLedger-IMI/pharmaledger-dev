import ContainerController from "../../cardinal/controllers/base-controllers/ContainerController.js";

export default class AnchorApiController extends ContainerController {
    constructor(element) {
        super(element);

        this.model = this.setModel({
            // Your JavaScript object model here.
            api: {
                label: "Please enter AnchorAPI URL",
                name: "api",
                required: true,
                placeholder: "Please enter URL ...",
                value: ''
            }
        });

        let onsubmit= (event) => {
            let apiurl = this.model.getChainValue('api.value')+'/echo';
           fetch(apiurl, { mode : "cors"}).then((response) => {
               if (response.ok)
               {
                   return response.json();
               }

           }).then((data) => {
               console.log(data);
               alert(data.content);
           })
               .catch((err) => {
                   console.log(err);
                   alert('Failed to call API');
               })

        };
        element.addEventListener('onsubmit', onsubmit, true);

    }
}