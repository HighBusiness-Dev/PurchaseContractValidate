/// <reference path="../../../../../../lib/p2js.d.ts" />
/// <reference path="../../../../../../lib/api.d.ts" />
/// <reference path="../../../../../../lib/qadextensionsgen.d.ts" />
/// <reference path="../../../../../../lib/purchasinggen.d.ts" />
/// <reference path="../../../../../../lib/basegen.d.ts" />

namespace com.extensions.qadextensions.dev {
    import PurchaseOrderDTO = com.qad.purchasing.purchaseorders.gen.dto.PurchaseOrderHeaderData;
    import PurchaseOrderConfDTO = com.qad.purchasing.purchaseorders.gen.dto.PurchaseOrderHeaderConfData;
    import ServiceLocator = com.qad.tsfoundation.service.ServiceLocator;
    
    import GeneralizedCodes = com.qad.base.codes.gen.bc.GeneralizedCodes;  // Atualizado o namespace de GeneralizedCodes
    import KeyFieldDTO = com.qad.p2js.bcscriptrunner.dto.KeyFieldDTO;      // Import para mensagem de erro

    // Classe dedicada para validação
    export class PurchaseOrderValidation {
        private generalizedCodes: GeneralizedCodes;

        constructor() {
            // Instancia a classe GeneralizedCodes
            this.generalizedCodes = <GeneralizedCodes>ServiceLocator.STATIC_INSTANCE.getService(GeneralizedCodes.ENTITY_URI);
        }

        public validateContract(DomainCode: string, Contract: string): boolean {
            // Chama o método fetch para verificar se o código existe
            const result = this.generalizedCodes.fetch(DomainCode, "po_contract", Contract);
            
            // Verifica se o retorno contém dados
            if (result && result.dsGeneralizedCode && result.dsGeneralizedCode.ttGeneralizedCode.length > 0) {
                // O código existe
                return true;
            }
            // O código não existe
            return false;
        }
    }

    export class PurchaseOrderHeaders extends com.qad.purchasing.purchaseorders.gen.bc.PurchaseOrderHeaders {

        // Construtor para inicializar a classe
        constructor() {
            super("com.extensions.qadextensions.dev.bc.Abc");
        }

        /** Sobrescrevendo o método create para adicionar a validação */
        public createWithConfirmation(dto: PurchaseOrderDTO, dtoConf:PurchaseOrderConfDTO): void {
            const record = dto.dsPurchaseOrderHeader.ttPurchaseOrderHeader[0];

            // Instancia a classe de validação
            const validator = new PurchaseOrderValidation();

            // Definição da mensagem de erro
            let keyFieldDTOForError = KeyFieldDTO.createInstance();
            KeyFieldDTO.addField(keyFieldDTOForError, "Contract", record.Contract);

            // Valida se o campo 'po_contract' existe no GeneralizedCodes
            let isValid = validator.validateContract(record.DomainCode, record.Contract);
            
            if (!isValid) {
                // Adiciona um erro de validação caso o código não exista
                this.addValidationError("Missed contract value", "PurchaseOrder", "Contract", keyFieldDTOForError);
            }

            // Lança os erros de validação, se existirem
            this.throwAddedValidationErrors();

            // Chama o método create da classe pai
            super.createWithConfirmation(dto, dtoConf);
        }
    }

    export class PurchaseOrderFactory extends com.qad.purchasing.purchaseorders.gen.bc.PurchaseOrderHeadersFactory {
        public getInstance(): PurchaseOrderHeaders {
            return new PurchaseOrderHeaders();
        }
    }

    ServiceLocator.STATIC_INSTANCE.addService(PurchaseOrderHeaders.ENTITY_URI, new PurchaseOrderFactory());
    com.qad.p2js.bcscriptrunner.ScriptsRegistry.registerBCScript(PurchaseOrderHeaders.ENTITY_URI, [
        'createWithConfirmation'
    ]);
}
