const express = require('express')
const ExpressError = require('../expressError')
const database = require('../db')
const slugify = require('slugify')

let router = new express.Router()

router.get('/',async function (err,req,res,next){
    try{
        const result = await database.query(
            `SELECT code, name
            FROM companies 
            ORDER BY name`
            )
        return res.json({'companies' : result.rows})
    }
    catch(err){
        return next(err)
    }
})

router.get('/:code', async function(err,req,res,next){
    try{
        let code = req.params.code
        const companies = await database.query(
            `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
            [code]
        )
        const invoices = await database.query(
            `SELECT id
            FROM invoices
            WHERE comp_code = $1`,
            [code]
        )

        if (companies.rows.length === 0){
            throw new ExpressError(`Company does not exist: ${code}`,404)
        }
        let company = companies.rows[0];
        let invoice = invoices.rows;
        company.invoice = invoice.map(inv => inv.id)
        return res.json({'company': company})
    }
    catch(err){
        return next(err)
    }
})

router.post('/', async function(err,req,res,next){
    try{
        let code = slugify(name, {lower: true})
        let {name, descrip} = req.body;
        const result = await database.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, descrip]
        )
        return res.status(201).json({'company' : result.rows[0]})
    }
    catch(err){
        return next(err)
    }
})

router.put('/:code', async function(err,req,res,next){
    try{
        let code = req.params.code;
        let {name, descrip} = req.body;
        const result = await database.query(
            `UPDATE companies
            SET name=$1, description=$2 
            WHERE code=$3
            RETURNING code, name, description`,
            [code, name, descrip]
        )
        if(result.rows.length === 0){
            throw new ExpressError(`Company does not exist: ${code}`,404)
        }
        else{
            return res.json({'company': result.rows[0]})
        }
    }
    catch(err){
        return next(err)
    }
})


router.delete('/:code', async function(err,req,res,next){
    try{
        let code = req.params.code;
        const result = await database.query(
            `DELETE FROM companies
            WHERE code=$1
            RETURNING code`, [code]
        )
        if(result.rows.length === 0){
            throw new ExpressError(`Company does not exist: ${code}`,404)
        }
        else{
            return res.json({'status': 'deleted'})
        }
    }
    catch(err){
        return next(err)
    }
})

module.exports = router;