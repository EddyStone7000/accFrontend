describe("Adaptive Cruise Control Simulation", () => {
    beforeEach(() => {
      // Besuche die Hauptseite vor jedem Test
      cy.visit("http://localhost:4200/");
    });
  
    it("should start the simulation and display correct parameter values", () => {
      // Initiale Werte
      const leadSpeed = 50;
      const distance = 15;
      const egoSpeed = 40;
  
      // Eingabefelder für leadSpeed, distance und egoSpeed
      cy.get('input[placeholder="Lead Speed"]').type(leadSpeed.toString());
      cy.get('input[placeholder="Distance"]').type(distance.toString());
      cy.get('input[placeholder="Ego Speed"]').type(egoSpeed.toString());
  
      // Interzeptiere die POST-Anfrage an /api/run, 
      cy.intercept("POST", "/api/run").as("startSimulation");
  
      // "Start Simulation"-Button
      cy.get('button').contains("Start Simulation").click();
  
      // Warte auf die POST-Anfrage
      cy.wait("@startSimulation").its("request.body").should("deep.equal", {
        leadSpeed: leadSpeed,
        distance: distance,
        egoSpeed: egoSpeed,
      });
  
      // Überprüfe initiale Werte im Frontend (vor dynamischen Änderungen)
      cy.get('#leadSpeed').should("have.text", leadSpeed.toString());
      cy.get('#distance').should("have.text", distance.toString());
      cy.get('#egoSpeed').should("have.text", egoSpeed.toString());
  
      // Interzeptiere die GET-Anfrage an /api/data, um die aktualisierten Werte zu prüfen
      cy.intercept("GET", "/api/data").as("getSimulationData");
  
      // Warte 2 Sekunden, damit die Simulation Daten aktualisiert
      cy.wait(2000);
  
      // Hole die aktuellen Simulationsdaten vom Backend
      cy.wait("@getSimulationData").then((interception) => {
        const simulationData = interception.response?.body || {};
  
        // Extrahiere die Werte vom Backend
        const backendLeadSpeed = simulationData.leadSpeed;
        const backendDistance = simulationData.distance;
        const backendEgoSpeed = simulationData.egoSpeed;
  
        // Überprüfe die Werte im Frontend mit Toleranz
        cy.get('#leadSpeed')
          .invoke("text")
          .then(parseFloat)
          .should("be.closeTo", backendLeadSpeed, 1); // Toleranz von 1 km/h
        cy.get('#distance')
          .invoke("text")
          .then(parseFloat)
          .should("be.closeTo", backendDistance, 1); // Toleranz von 1 m
        cy.get('#egoSpeed')
          .invoke("text")
          .then(parseFloat)
          .should("be.closeTo", backendEgoSpeed, 1); // Toleranz von 1 km/h
      });
  
      // Überprüfe, ob der "Stop Simulation"-Button sichtbar ist
      cy.get('button').contains("Stop Simulation").should("be.visible");
    });
  });