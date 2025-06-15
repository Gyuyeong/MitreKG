import MitreKnowledgeGraphConstructor from "./mitreKnowlegeGraphConstructor"

const enterprise: MitreKnowledgeGraphConstructor = await MitreKnowledgeGraphConstructor.init("Enterprise ATT&CK")
console.log("Constructing Enterprise ATT&CK")
await enterprise.run()
console.log("Finished Constructing Enterprise")

const mobile: MitreKnowledgeGraphConstructor = await MitreKnowledgeGraphConstructor.init("Mobile ATT&CK")
console.log("Constructing Mobile ATT&CK")
await mobile.run()
console.log("Finished Constructing Mobile")

const ics: MitreKnowledgeGraphConstructor = await MitreKnowledgeGraphConstructor.init("ICS ATT&CK")
console.log("Constructing ICS ATT&CK")
await ics.run()
console.log("Finished Constructing ICS")