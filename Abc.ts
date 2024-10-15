/// <reference path="../../../../../../lib/p2js.d.ts" />
/// <reference path="../../../../../../lib/api.d.ts" />
/// <reference path="../../../../../../lib/qadextensionsgen.d.ts" />
/// <reference path="../../../../../../lib/purchasinggen.d.ts" />
/// <reference path="../../../../../../lib/basegen.d.ts" />

namespace com.extensions.qadextensions.dev {
    // Importações de dependências e tipos
    import PurchaseOrderDTO = com.qad.purchasing.purchaseorders.gen.dto.PurchaseOrderHeaderData;
    import PurchaseOrderConfDTO = com.qad.purchasing.purchaseorders.gen.dto.PurchaseOrderHeaderConfData;
    import ServiceLocator = com.qad.tsfoundation.service.ServiceLocator;
    
    import GeneralizedCodes = com.qad.base.codes.gen.bc.GeneralizedCodes;  // Atualizado o namespace de GeneralizedCodes
    import KeyFieldDTO = com.qad.p2js.bcscriptrunner.dto.KeyFieldDTO;      // Import para estrutura de mensagem de erro

    // Classe dedicada para validação de contratos de Purchase Order
    export class PurchaseOrderValidation {
        private generalizedCodes: GeneralizedCodes;

        constructor() {
            // Instancia a classe GeneralizedCodes a partir do ServiceLocator
            this.generalizedCodes = <GeneralizedCodes>ServiceLocator.STATIC_INSTANCE.getService(GeneralizedCodes.ENTITY_URI);
        }

        // Método para validar o contrato baseado no código do domínio e contrato fornecidos
        public validateContract(DomainCode: string, Contract: string): boolean {
            // Chama o método fetch para verificar se o código de contrato existe dentro do domínio especificado
            const result = this.generalizedCodes.fetch(DomainCode, "po_contract", Contract);
            
            // Verifica se o retorno contém os dados necessários
            if (result && result.dsGeneralizedCode && result.dsGeneralizedCode.ttGeneralizedCode.length > 0) {
                // O código existe, retorna true
                return true;
            }
            // O código não existe, retorna false
            return false;
        }
    }

    // Classe que estende a funcionalidade de PurchaseOrderHeaders
    export class PurchaseOrderHeaders extends com.qad.purchasing.purchaseorders.gen.bc.PurchaseOrderHeaders {

        // Construtor para inicializar a classe com o URI específico
        constructor() {
            super("com.extensions.qadextensions.dev.bc.Abc");
        }

        /** Sobrescrevendo o método create para adicionar a validação */
        public createWithConfirmation(dto: PurchaseOrderDTO, dtoConf: PurchaseOrderConfDTO): void {
            // Obtém o primeiro registro da ordem de compra
            const record = dto.dsPurchaseOrderHeader.ttPurchaseOrderHeader[0];

            // Instancia a classe de validação
            const validator = new PurchaseOrderValidation();

            // Definição da mensagem de erro, caso ocorra
            let keyFieldDTOForError = KeyFieldDTO.createInstance();
            KeyFieldDTO.addField(keyFieldDTOForError, "Contract", record.Contract);

            // Valida se o campo 'po_contract' existe nos códigos generalizados
            let isValid = validator.validateContract(record.DomainCode, record.Contract);
            
            if (!isValid) {
                // Se o contrato não for válido, adiciona uma mensagem de erro de validação
                this.addValidationError("Missed contract value", "PurchaseOrder", "Contract", keyFieldDTOForError);
            }

            // Lança qualquer erro de validação que tenha sido adicionado
            this.throwAddedValidationErrors();

            // Chama o método createWithConfirmation da classe pai para continuar o fluxo de criação
            super.createWithConfirmation(dto, dtoConf);
        }
    }

    // Fábrica de PurchaseOrderHeaders para criar instâncias
    export class PurchaseOrderFactory extends com.qad.purchasing.purchaseorders.gen.bc.PurchaseOrderHeadersFactory {
        public getInstance(): PurchaseOrderHeaders {
            return new PurchaseOrderHeaders();
        }
    }

    // Adiciona o serviço ao ServiceLocator para PurchaseOrderHeaders
    ServiceLocator.STATIC_INSTANCE.addService(PurchaseOrderHeaders.ENTITY_URI, new PurchaseOrderFactory());

    // Registra o script que deve ser executado para o URI da entidade de PurchaseOrderHeaders
    com.qad.p2js.bcscriptrunner.ScriptsRegistry.registerBCScript(PurchaseOrderHeaders.ENTITY_URI, [
        'createWithConfirmation'
    ]);
}
